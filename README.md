# PackageManager.gs
Collection of apps scripts, modular libraries, with import mechanism

## Quickstart

- Create a new project in apps scripts
- Copy and paste _import.gs into a new script file (this MUST be the first one created)
- Copy and paste Requests and AppsscriptsRequests into the project
- Import the libraries

```js
function myFunction () {
  Import('Requests', {namespace: "Libs.requests"}, {});
  Import('AppscriptsRequests', {namespace: "Libs.appscripts"}, {});

  Libs.requests
  Libs.appscripts.new_();  // creates new projects
}
```
