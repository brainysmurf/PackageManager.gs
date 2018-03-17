# PackageManager.gs
Collection of apps scripts, modular libraries, with import mechanism

## Quickest Start (simpler, but less robust)

- Create a new project in apps scripts
- Copy the target library into the project
- Import it with `Import(name)`
- Check out READMEs for libraries below
- Use them

```js
function myFunction () {
  var Appscripts = Import('AppscriptsRequests');
  var appscripts = Appscripts();
  appscripts.new_();  // creates new project
}
```

## Quickstart (more features)

- Create a new project in apps scripts
- Copy and paste `_import.gs` into the project before the next library(ies)
- Copy the target library into the project
- Import it into global namespace with `Import(name, {namespace: 'Name'}, {})`
- Check out READMEs for libraries below
- Use them

```js
function myFunction () {
  Import('AppscriptsRequests', {namespace: "AppscriptsRequests"}, {});
  Appscripts.new_();  // creates new project
}
```

# Requests.gs

