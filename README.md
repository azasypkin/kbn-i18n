# What `kbn-i18n` is?
Tool that traverses through all `.js` and `.html` files in any folder within Kibana and extracts all potentially localizable message strings.

# Usage

```bash
$ yarn build
$ node cli /path/to/kibana/source/root/or/folder/within/kibana
```

In console you should see something like this:

![alt text](https://raw.githubusercontent.com/azasypkin/kbn-i18n/master/screenshots/output.png)


