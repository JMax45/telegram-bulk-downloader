#!/usr/bin/env node

import TelegramBulkDownloader from './TelegramBulkDownloader';
import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const program = new Command();

program.name('telegram-bulk-downloader').action(() => {
  const telegramBulkDownloader = new TelegramBulkDownloader();
  telegramBulkDownloader.run();
});

program
  .command('wipe')
  .description('Wipes data stored by telegram-bulk-downloader')
  .option('--soft', 'Only wipes out sensitive authentication data')
  .action((options) => {
    const telegramBulkDownloader = new TelegramBulkDownloader();
    const storagePath = telegramBulkDownloader.getStoragePath();

    console.log(
      'Deleting',
      options.soft ? path.join(storagePath, 'credentials') : storagePath
    );

    if (options.soft) {
      promisify(fs.rm)(path.join(storagePath, 'credentials'));
    } else {
      promisify(fs.rm)(storagePath, { recursive: true });
    }
  });

program.parse();
