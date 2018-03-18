# PackageManager.gs
Toolchain for modular libraries, organized with importing mechanism.

## Quickest Start (simpler, but less robust)

- Copy the target library into the project
- Import it with `Import(name)`, returning object is a reference to library
- Initialize the library
- Check out READMEs for libraries below
- Use them

```js
function myFunction () {
  var Appscripts = Import('AppscriptsRequests');  // import the reference
  var appscripts = Appscripts();                  // init the library
  appscripts.new_();  // creates new appsscripts project 
}
```

## Quickstart (more features)

- Copy and paste `_import.gs` into the project before the next library(ies)
- Copy the target library into the project
- Import initialized library into global namespace with `Import(name, {namespace: 'Name'}, {})`
- Check out READMEs for libraries below
- Use them

```js
function myFunction () {
  Import(
    'AppscriptsRequests',        // name has to be the same as declared in library
    {namespace: "Appsscripts"},  // instructs import to pollute the global namespace
    {}                           // Passes this to the library
  );
  Appsscripts.new_();  // creates new project
}
```

# Import

Brings in libraries. Optionally pollute the global namespace. Optionally store references in variables.

## Quickstart

Install by copying and pasting \_import.gs into your project (libraries can be added after this). Use it:

```js
function myFunction () {
  var requests = Import("Requests");  // reference, still need to init it
  Import(
    "Requests",
    {namespace: "Requests"}           // pollute the global namespace
                                      // just two parameters, so not inited
  ); 
  var app = {};
  Import(
    "Requests",
    {base: app, attr: "requests"},    //  add it to the app object
    {}                                // third parameter inits it
  );  
}
```

# Requests

Interact with the Google APIs using UrlFetchApp.fetch. Add your scopes manually in appsscript.json.

## Quickstart

```js
function myFunction () {
  Import("Requests", {namespace: "Requests"}, {
    oauth: 'me'  // every request will have Authorization bearer
  });
  
  // https://developers.google.com/apps-script/api/reference/rest/v1/projects/create
  // Should be a post request at specific URL
  var response = Requests.post('https://script.googleapis.com/v1/projects');
  response.json();  // returns Project resource
  response.raw      // returns raw Response 
  
  // Look ma, use discovery URL
  Import("Requests", {namespace: "ViewProjectFiles"}, {
    oauth: 'me',
    discovery: {
      name: 'scripts',
      version: 'v1',
      category: 'projects',
      method: 'getContent'
    }
  });
  var response;
  response = ViewProjectFiles.get({
    scriptId: ScriptApp.getScriptId()  // https://script.googleapis.com/v1/projects/{scriptId}/content 
  });
  response.json().files;
}
```
