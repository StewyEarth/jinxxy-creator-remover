// Build and zip project for distribution
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const packageInfo = require('./package.json');
const version = packageInfo.version;
const manifestPath = "dev/manifest.json";


async function updateManifest(target) {
  return new Promise((resolve, reject) => {
    fs.readFile(manifestPath, 'utf8', (err, data) => {
      if (err) return reject('Error reading file:', err);
      try {
        // Parse the JSON data
        const jsonData = JSON.parse(data);
        jsonData.version = version;
        // Update the data
        if (target === 'chrome') {
          console.log("Building for Chrome");
          jsonData.background = {
            "service_worker": "background-script.js",
            "type": "module"
          };
        } else if (target === 'firefox') {
          console.log("Building for Firefox");
          jsonData.background = {
            "scripts": ["background-script.js"],
            "type": "module"
          };
        }
        console.log("Updated manifest:", jsonData);
        // Write the updated data back to the file
        fs.writeFile(manifestPath, JSON.stringify(jsonData), (err) => {
          if (err) return reject('Error writing file:', err);
          resolve();
        });
      } catch (error) {
        reject('Error parsing JSON:', error);
      }
    });
  });
}

async function buildZip(target) {
  await updateManifest(target);
  return new Promise((resolve, reject) => {
    let output = fs.createWriteStream(`release/jinxxycompanion-${target}-v${version}.zip`);
    let archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', function () {
      console.log(archive.pointer() + ' total bytes');
      console.log('Archiver has been finalized and the output file descriptor has closed.');
      resolve();
    });

    archive.on('error', function (err) {
      reject(err);
    });

    archive.pipe(output);
    archive.directory('dev/', false);
    archive.finalize();
  })
};

async function buildAll() {
  try {
    await buildZip('firefox');
    await buildZip('chrome');
    console.log('Both builds complete!');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

buildAll();