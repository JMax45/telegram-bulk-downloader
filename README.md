# telegram-bulk-downloader

telegram-bulk-downloader is a command-line tool built with Node.js that allows you to download all images in a Telegram chat. It provides a convenient way to bulk download images and has plans to support other media types in the future.

## Installation

To install telegram-bulk-downloader, follow these steps:

1. Clone the repository from GitHub:

   ```shell
   git clone https://github.com/JMax45/telegram-bulk-downloader
   cd telegram-bulk-downloader
   ```

2. Install the tool globally using npm:

   ```shell
   npm install ./ -g
   ```

   Please note that in the future, the tool will also be available on npm for easier installation.

## Usage

### Downloading

To start downloading images from a Telegram chat, simply run the `telegram-bulk-downloader` command in your terminal. The interface is interactive and will guide you through the process.

### Wiping Data

If you have finished using the tool and do not plan to use it for a while, it is recommended to delete the stored data as it contains sensitive information. You can perform a data wipe using the following command:

```shell
telegram-bulk-downloader wipe
```

This command will remove all data, including authentication information.

## License

This project is licensed under the [MIT License](LICENSE).
