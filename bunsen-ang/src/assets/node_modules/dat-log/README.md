# dat-log

view history of a dat in the CLI

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

`dat-log` prints all changes, the file versions, and information about the dat:

```
❯ dat-log dat://64375abb733a62fa301b1f124427e825d292a6d3ba25a26c9d4303a7987bec65
1 [put] / 0 B (0 blocks)
2 [put] /README 175 B (1 block)
3 [put] /dat.json 309 B (1 block)
4 [put] /far-manzanar.csv 2.0 MB (31 blocks)
5 [put] /far-minidoka.csv 2.1 MB (33 blocks)
6 [put] /far-poston.csv 3.6 MB (55 blocks)
7 [put] /wra-master.csv 73 MB (1111 blocks)

Log synced with network

Archive has 7 changes (puts: +7, dels: -0)
Current Size: 80 MB
Total Size:
- Metadata 436 B
- Content 80 MB
Blocks:
- Metadata 8
- Content 1232
```

## Install

If you already have `dat` installed, run it with `dat log`!

```
npm install -g dat-log
```

## Usage

You can view history for a local dat (any directory with a `.dat` folder):

```sh
dat-log /my-data
```

Or view history for a remote dat using the dat link:

```sh
dat-log dat://64375abb733a62fa301b1f124427e825d292a6d3ba25a26c9d4303a7987bec65 
```

Options: 

* `--live, -l`: Keep process running and view live history

## License

[MIT](LICENSE.md)

[npm-image]: https://img.shields.io/npm/v/dat-log.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/dat-log
[travis-image]: https://img.shields.io/travis/joehand/dat-log.svg?style=flat-square
[travis-url]: https://travis-ci.org/joehand/dat-log
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
