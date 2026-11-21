// usage: node scripts/bump-versions.js chatbot.css 26   -> sets ?v= for that asset in every html/js file
const fs=require("fs"),path=require("path");
const [,, name, ver]=process.argv;
if(!name||!ver){console.log("usage: node scripts/bump-versions.js <asset-file> <version>");process.exit(1)}
const re=new RegExp(name.replace(/\./g,"\\.")+"\\?v=[\\w.-]+","g");let n=0;
(function walk(d){for(const f of fs.readdirSync(d)){if(f==="node_modules"||f===".git")continue;const p=path.join(d,f),s=fs.statSync(p);
if(s.isDirectory())walk(p);else if(/\.(html|js)$/.test(f)){const t=fs.readFileSync(p,"utf8");if(re.test(t)){re.lastIndex=0;fs.writeFileSync(p,t.replace(re,name+"?v="+ver));n++}}}})(".");
console.log("updated",n,"files");
