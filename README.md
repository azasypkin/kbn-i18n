# What `kbn-i18n` is?
Tool that traverses through all `.js` and `.html` files in any folder within Kibana and extracts all potentially localizable message strings.

There are quite a few false positives, but should give a general idea nevertheless.

# Usage

```bash
$ yarn build
$ yarn start ../master/kibana/ # path to kibana source root or any folder within it.
```

In console you should see something like this:

![alt text](https://raw.githubusercontent.com/azasypkin/kbn-i18n/master/screenshots/output.png)


