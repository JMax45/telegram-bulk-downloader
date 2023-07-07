import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import Byteroo, { Container } from 'byteroo';
import { Entity } from 'telegram/define';
import extractDisplayName from './helpers/extractDisplayName';
import ask from './helpers/ask';
import JsonSerializer from './helpers/JsonSerializer';
import checkbox from '@inquirer/checkbox';
import getInputFilter from './helpers/getInputFilter';
import getFilenameExtension from './helpers/getFilenameExtension';
import MediaType from './types/MediaType';

class TelegramBulkDownloader {
  private storage: Byteroo;
  private credentials: Container;
  private state: Container;
  isDownloading: boolean;
  private SIGINT: boolean;
  private client?: TelegramClient;
  constructor() {
    this.storage = new Byteroo({
      name: 'TelegramBulkDownloader',
      autocommit: true,
    });
    this.credentials = this.storage.getContainerSync(
      'credentials'
    ) as Container;
    this.state = this.storage.getContainerSync('state') as Container;
    this.isDownloading = false;
    this.SIGINT = false;
  }

  private async newDownload() {
    if (!this.client) throw new Error('TelegramClient undefined');
    const query = await inquirer.prompt([
      {
        name: 'id',
        message: 'Please enter username or chat id of target: ',
      },
    ]);

    try {
      const res = await this.client.getEntity(query.id);
      const { metadata } = await inquirer.prompt([
        {
          name: 'metadata',
          message: 'Do you want to include metadata.json? (Recommended: no)',
          type: 'confirm',
        },
      ]);
      let mediaTypes: MediaType[] = [];
      while (mediaTypes.length <= 0) {
        mediaTypes = await checkbox({
          message: 'Select media types to download',
          choices: [
            { name: 'Pictures', value: 'InputMessagesFilterPhotos' },
            { name: 'Videos', value: 'InputMessagesFilterVideo' },
            { name: 'Documents', value: 'InputMessagesFilterDocument' },
            { name: 'Music', value: 'InputMessagesFilterMusic' },
            { name: 'Voice messages', value: 'InputMessagesFilterVoice' },
            { name: 'GIFs', value: 'InputMessagesFilterGif' },
          ],
        });
      }
      const outPath = await ask('Enter the folder path for file storage: ');
      this.state.set(res.id.toString(), {
        displayName: extractDisplayName(res),
        entityJson: res.toJSON(),
        outPath: path.resolve(outPath),
        metadata,
        mediaTypes: mediaTypes.map((e) => ({ type: e, offset: 0 })),
      });
      await this.download(res);
    } catch (err) {
      console.error('Failed to retrieve chat', err);
      this.main();
    }
  }

  private async download(entity: Entity) {
    if (!this.client) throw new Error('TelegramClient undefined');
    const id = entity.id.toString();

    for (const mediaType of this.state.get(id).mediaTypes) {
      await this.downloadMediaType(entity, mediaType.type);
    }

    this.state.remove(id);
    await this.state.commit();
    process.exit(0);
  }

  private async downloadMediaType(entity: Entity, mediaType: MediaType) {
    if (!this.client) throw new Error('TelegramClient undefined');
    this.isDownloading = true;
    const id = entity.id.toString();
    const latestMessage = await this.client.getMessages(entity, { limit: 1 });
    this.state.set(id, { ...this.state.get(id), limit: latestMessage[0].id });

    const metadataOption = this.state.get(id).metadata;
    let jsonSerializer;
    if (metadataOption) {
      jsonSerializer = new JsonSerializer(
        path.join(this.state.get(id).outPath, 'metadata.json')
      );
    }

    while (true) {
      let offset = this.state
        .get(id)
        .mediaTypes.find((e: any) => e.type === mediaType).offset;

      const messages = await this.client.getMessages(entity, {
        limit: 1000,
        offsetId: offset,
        reverse: true,
        filter: getInputFilter(mediaType),
      });

      const mediaMessages = messages;

      const downloadDir = this.state.get(id).outPath;
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      let msgId = offset;
      for (const msg of mediaMessages) {
        const buffer = await this.client.downloadMedia(msg);
        const filePath = path.join(
          downloadDir,
          `${msg.id}.${getFilenameExtension(msg)}`
        );
        fs.writeFileSync(filePath, buffer as any);
        msgId = msg.id;
        console.log(
          `Downloaded file ${filePath}, offset: ${this.state.get(id).offset}`
        );

        if (jsonSerializer) await jsonSerializer.append(msg);
        if (this.SIGINT) break;
      }

      offset = mediaMessages.length <= 0 ? offset + 999 : msgId;

      this.state.set(id, {
        ...this.state.get(id),
        mediaTypes: this.state.get(id).mediaTypes.map((e: any) => {
          if (e.type === mediaType)
            return {
              ...e,
              offset,
            };
          return e;
        }),
      });

      if (this.SIGINT) {
        console.log(`Exiting, SIGINT=${this.SIGINT}`);
        await this.client.disconnect();
        await this.client.destroy();
        await this.state.commit();
        process.exit(0);
      }
      if (offset >= this.state.get(id).limit) {
        console.log(`Exiting, SIGINT=${this.SIGINT}`);
        this.state.set(id, {
          ...this.state.get(id),
          mediaTypes: this.state
            .get(id)
            .mediaTypes.filter((e: any) => e.type !== mediaType),
        });
        break;
      }
    }
  }

  private async resume() {
    if (!this.client) throw new Error('TelegramClient undefined');
    const res = await inquirer.prompt({
      name: 'resume',
      type: 'list',
      message: 'Choose a chat',
      choices: [
        ...this.state
          .list()
          .map((e) => ({ name: this.state.get(e).displayName || e, value: e })),
        { name: 'Back', value: 'backbutton' },
      ],
    });

    if (res.resume === 'backbutton') {
      return this.main();
    }

    const entityRes = await this.client.getEntity(
      this.state.get(res.resume).entityJson.username ||
        this.state.get(res.resume).entityJson.id
    );
    this.download(entityRes);
  }

  async main() {
    let API_ID = this.credentials.get('API_ID');
    if (!API_ID) {
      API_ID = await ask('Please provide your API_ID: ');
      this.credentials.set('API_ID', API_ID);
    }

    let API_HASH = this.credentials.get('API_HASH');
    if (!API_HASH) {
      API_HASH = await ask('Please provide your API_HASH: ', {
        type: 'password',
      });
      this.credentials.set('API_HASH', API_HASH);
    }

    if (!this.client) {
      this.client = new TelegramClient(
        new StringSession(this.credentials.get('session')),
        parseInt(API_ID),
        API_HASH,
        {}
      );
    }

    if (this.client.disconnected) {
      await this.client.start({
        phoneNumber: ask.bind(undefined, 'Please enter your phone number: '),
        password: ask.bind(undefined, 'Please enter your password: ', {
          type: 'password',
        }),
        phoneCode: ask.bind(undefined, 'Please enter the code you received: ', {
          type: 'password',
        }),
        onError: (err) => console.log(err),
      });

      this.credentials.set(
        'session',
        await (this.client as any).session.save()
      );
    }

    const menu = await inquirer.prompt({
      name: 'option',
      type: 'list',
      message: 'Choose an option',
      choices: [
        { name: 'Start new download', value: 'new_download' },
        { name: 'Resume active download', value: 'resume' },
        { name: 'Exit', value: 'exit' },
      ],
    });

    switch (menu.option) {
      case 'exit':
        process.exit(0);
      case 'new_download':
        this.newDownload();
        break;
      case 'resume':
        this.resume();
        break;
    }
  }

  run() {
    this.main();

    process.on('SIGINT', () => {
      console.log('Caught interrupt signal');
      if (!this.isDownloading) process.exit(0);
      this.SIGINT = true;
    });
  }

  getStoragePath() {
    return this.storage.path;
  }
}

export default TelegramBulkDownloader;
