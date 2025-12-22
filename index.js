export function go(path, write) {
  if (path === '.') {
    path = process.cwd()
  } else if (!/^\//.test(path)) {
    // Path is absolute, do not modify
  } else {
    // Turn relative path into absolute
    path = process.cwd() + '/' + path
  }

  console.log("go() method inside index.js");
  console.log(path, write);
};
