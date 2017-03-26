# nativescript-cloud
Used for cloud support in NativeScript CLI

### Development
The project is written in TypeScript. After cloning it, you can setup it by executing the following commands in your terminal:
* `$ npm i --ignore-scripts` - NOTE: `--ignore-scripts` is a must.
* `$ npm i -g grunt-cli` (only in case you do not have it installed globally)
* `$ grunt test` (first execution of this command might take a little bit longer, consecutive calls will work much faster)

After that you can make changes in the code. In order to transpile them, just execute:
* `$ grunt`

You can pack a new version of the library by executing:
* `$ grunt pack`
