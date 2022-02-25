import Handlebars from 'handlebars';
import fetch from 'node-fetch';
import xml2js from 'xml2js';
import { promises as fs } from 'fs';
import { program } from 'commander';

program
  .option('-t, --template <file>', 'path to template file')
  .option('-f, --feed <URL>', 'URL of blog feed')
  .option('-o, --output <file>', 'File to write output to')
  .parse(process.argv);

const parser = new xml2js.Parser({
  attrkey: '_attr',
  charkey: '_text',
  explicitCharkey: true,
  normalizeTags: true,
  explicitArray: false
});
const waitFor = [];

Handlebars.registerHelper('for', (context, options) => {
  let start = options.hash.start || 0;
  let end = options.hash.end || context.length;
  start *= 1;
  end *= 1;
  let ret = '';
  for(let i = start; i < end; i++) {
    ret += options.fn(context[i]);
  }
  return ret;
})

// read in template
waitFor.push(fs.readFile(program.template)
.then((data) => {
  return Handlebars.compile(data.toString());
}));
// read in feed
waitFor.push(fetch(program.feed)
.then((res) => {
  return res.text();
})
.then((data) => {
  // parse feed
  return parser.parseStringPromise(data)
})
.then((result) => {
  console.log(result.feed.entry[0]);
  return result;
}));
// build README
Promise.all(waitFor)
.then(([template, feed]) => {
  // write out README
  const result = template(feed)
  console.log(result);
  if(program.output) {
    return fs.writeFile(program.output, result);
  }
});
