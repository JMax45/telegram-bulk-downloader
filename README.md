# telegram-bulk-downloader

[![npm](https://img.shields.io/npm/v/telegram-bulk-downloader?logo=npm)](https://www.npmjs.com/package/telegram-bulk-downloader)

telegram-bulk-downloader is a command-line tool built with Node.js that allows you to download media files from a Telegram chat. It provides a convenient way to bulk download images, videos, documents, music, voice messages, and GIFs.

https://github.com/JMax45/telegram-bulk-downloader/assets/36378436/4e744c10-7e6a-4167-b528-bf63d02dcd67

## Supported Media Types:

- Photos.
- Videos.
- Documents.
- Music.
- Voice messages.
- GIFs.

## Installation

To install telegram-bulk-downloader, use npm:

```shell
npm install -g telegram-bulk-downloader
```

## Usage

### Downloading

To start downloading media files from a Telegram chat, simply run the `telegram-bulk-downloader` command in your terminal. The interface is interactive and will guide you through the process.

### Wiping Data

If you have finished using the tool and do not plan to use it for a while, it is recommended to delete the stored data as it contains sensitive information. You can perform a data wipe using the following command:

```shell
telegram-bulk-downloader wipe
```

This command will remove all data, including authentication information.

## License

This project is licensed under the [MIT License](LICENSE).
