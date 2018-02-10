const fs = require('fs');
const csv = require('fast-csv');
const emailUtil = require('email-validator');
const phoneUtil = require('google-libphonenumber')
                    .PhoneNumberUtil.getInstance();

const inputFile = (process.argv[2] !== undefined) ?
                   process.argv[2] : 'input.csv';
const outputFile = (process.argv[3] !== undefined) ?
                    process.argv[3] : 'output.json';

console.log('Loading csv...');
let arr = [];
csv
  .fromPath(inputFile)
  .on('data', (data) => {
    /*****************************************************
     ** ORGANIZE ALL THE DATA IN THE CSV INTO AN MATRIX **
     *****************************************************
     ** Assuming csv has headers, arr[0] = headers,     **
     ** arr[i] = actual data (i != 0)                   **
     *****************************************************/
    arr.push(data);
  })
  .on('end', () => {
    /**************************************
     ** SANITIZE AND VALIDATE EACH VALUE **
     **************************************/
    console.log('Sanitizing and validating values...');
    arr.forEach((row, i) => {
      row.forEach((col, j) => {
        // Replace forward slashes (/) with commas (,)
        arr[i][j] = arr[i][j].replace(/\//g, ',');
        // Remove whitespaces before and after commas (,)
        arr[i][j] = arr[i][j].replace(/\s?,\s?/g, ',');

        if (i>0){ // Skip checking headers
          if (j != arr[0].indexOf('fullname')  &&
              j != arr[0].indexOf('eid')       &&
              j != arr[0].indexOf('invisible') &&
              j != arr[0].indexOf('see_all')) {
                /***********************************************************/
                let valArr = arr[i][j].split(',');
                /***********************************************************/
                // Validate and sanitize phones
                if(arr[0][j].startsWith('phone')) {
                  for (let i=valArr.length-1;i>=0;i--) {
                    let number;
                    let isValid;
                    try {
                      number = phoneUtil.parse(valArr[i], 'BR');
                      isValid = phoneUtil.isValidNumber(number);
                    }
                    catch (e) {
                      isValid = false;
                    }

                    if (!isValid){
                      valArr.splice(i,1);
                    }
                    else {
                      valArr[i] = ''+number.getCountryCode()
                                     +number.getNationalNumber();
                    }
                  }
                }
                /***********************************************************/
                // Validate emails
                else if(arr[0][j].startsWith('email')) {
                  valArr = valArr.filter(emailUtil.validate);
                }
                /***********************************************************/
                // Validate classes
                else if(arr[0][j].startsWith('class')) {
                  valArr = valArr.filter(function(str){return str.length>0});
                }
                /***********************************************************/
                arr[i][j] = valArr;
              }

          // Sanitize invisible and see_all columns
          if(j == arr[0].indexOf('invisible') ||
             j == arr[0].indexOf('see_all')) {
               if(arr[i][j] == 'no' || arr[i][j] == '0') {
                 arr[i][j] = false;
               }
               else if(arr[i][j] != '') {
                 arr[i][j] = true;
               }
             }
        }
      });
    });

    /****************************************************************
     ** TRANSFORM EACH ROW INTO AN OBJECT AND STORE IT IN AN ARRAY **
     ****************************************************************/
    console.log('Transforming rows into objects...');
    let dataArr = [];
    for (let i=1;i<arr.length;i++) {
      let obj = {};
      if (arr[i].length == arr[0].length) {
        for (let j=0;j<arr[0].length;j++) {
          // arr[i][j] isn't empty/invalid
          if(arr[i][j].length>0 ||
             arr[0][j] == 'invisible' || arr[0][j] == 'see_all') {
               /************************************************************/
              // Decide proper property name, and tags/type
              // (e.g. 'class' must be in property 'classes')
              // (e.g. 'email Responsável,Pai' must be in property
              //       'addresses', 'type' must be 'email', 'tags' must be
              //       ['Responsável', 'Pai'], 'adress' must be arr[i][j])
              let propertyName = '';
              let addresses = [];
              if(arr[0][j].startsWith('email') ||
                 arr[0][j].startsWith('phone')) {
                   propertyName = 'addresses';

                   let type = '';
                   let tags = '';
                   let fields = arr[0][j].split(' ');
                   type = fields[0];
                   if (fields.length>1){
                     tags = fields[1].split(',');
                     // Remove empty tags
                     tags = tags.filter(function(str){return str.length>0});
                   }

                   arr[i][j].forEach((val) => {
                     let address = {};
                     address['type'] = type;
                     if (tags.length>0) { // has tags
                       address['tags'] = tags;
                     }
                     address['address'] = val;
                     addresses.push(address);
                   });

              }
              /************************************************************/
              else if(arr[0][j] == 'class') {
                propertyName = 'classes';
              }
              /************************************************************/
              else {
                propertyName =  arr[0][j];
              }
              /************************************************************/
              // Put the data on the object
              if(!obj.hasOwnProperty(propertyName)){
                switch(propertyName) {
                  case 'addresses':
                    obj[propertyName] = addresses;
                    break;
                  default:
                    obj[propertyName] = arr[i][j];
                }
              }
              else {
                switch(propertyName) {
                  case 'classes':
                    obj[propertyName] = obj[propertyName].concat(arr[i][j]);
                    break;
                  case 'addresses':
                    obj[propertyName] = obj[propertyName].concat(addresses);
                    break;
                  default:
                    obj[propertyName] = arr[i][j];
                }
              }
              /************************************************************/
          }
        }
      }
      // It's not an array, just an element
      if(obj.hasOwnProperty('classes') && obj['classes'].length == 1) {
        obj['classes'] = obj['classes'][0];
      }
      dataArr.push(obj);
    }

    /*********************************
     ** MERGE OBJECTS WITH SAME EID **
     *********************************/
    console.log('Merging rows with same EID...');
    // Count how many times each eid appear
    let sameEID = {};
    dataArr.forEach((obj, i) => {
      if(sameEID.hasOwnProperty(obj['eid'])) {
        sameEID[obj['eid']].push(i);
      }
      else {
        sameEID[obj['eid']] = [i];
      }
    });

    // Select only EIDs which appears 2 or more times
    for (let i=Object.keys(sameEID).length-1; i>=0; i--){
      if(sameEID[Object.keys(sameEID)[i]].length<2){
        delete sameEID[Object.keys(sameEID)[i]];
      }
    }

    // Do the merging
    let toSplice = [];
    for (eid in sameEID) {
      for (let i=1;i<sameEID[eid].length;i++) {
        /**************************************************************/
        if (dataArr[sameEID[eid][i]].hasOwnProperty('fullname')) {
          dataArr[sameEID[eid][0]]['fullname'] =
          dataArr[sameEID[eid][i]]['fullname'];
        }
        /**************************************************************/
        if (dataArr[sameEID[eid][i]].hasOwnProperty('classes')) {
          if (typeof dataArr[sameEID[eid][0]]['classes'] === 'string') {
            dataArr[sameEID[eid][0]]['classes'] =
            [dataArr[sameEID[eid][0]]['classes']];
          }
          if (dataArr[sameEID[eid][0]].hasOwnProperty('classes')) {
            dataArr[sameEID[eid][0]]['classes'] =
            dataArr[sameEID[eid][0]]['classes']
            .concat(dataArr[sameEID[eid][i]]['classes']);
          }
          else {
            dataArr[sameEID[eid][0]]['classes'] =
            dataArr[sameEID[eid][i]]['classes'];
          }
        }
        /**************************************************************/
        if (dataArr[sameEID[eid][i]].hasOwnProperty('addresses')) {
          if (dataArr[sameEID[eid][0]].hasOwnProperty('addresses')) {
            dataArr[sameEID[eid][0]]['addresses'] =
            dataArr[sameEID[eid][0]]['addresses']
            .concat(dataArr[sameEID[eid][i]]['addresses']);
          }
          else {
            dataArr[sameEID[eid][0]]['addresses'] =
            dataArr[sameEID[eid][i]]['addresses'];
          }
        }
        /**************************************************************/
        if (dataArr[sameEID[eid][i]].hasOwnProperty('invisible')) {
          if(typeof dataArr[sameEID[eid][i]]['invisible'] === 'boolean') {
            dataArr[sameEID[eid][0]]['invisible'] =
            dataArr[sameEID[eid][i]]['invisible'];
          }
        }
        /**************************************************************/
        if (dataArr[sameEID[eid][i]].hasOwnProperty('see_all')) {
          if(typeof dataArr[sameEID[eid][i]]['see_all'] === 'boolean') {
            dataArr[sameEID[eid][0]]['see_all'] =
            dataArr[sameEID[eid][i]]['see_all'];
          }
        }
        /**************************************************************/
        toSplice.push(sameEID[eid][i]);
      }
    }

    // Then, delete the ones with data merged
    toSplice.sort((a,b)=>a-b);
    let i;
    while((i=toSplice.pop()) !== undefined) {
      dataArr.splice(i, 1);
    }

    /******************
     ** LAST TOUCHES **
     ******************/
    console.log('Finishing...');
    for (obj of dataArr) {
      /*****************************************/
      // Merge equal address values and their tags
      if(obj.hasOwnProperty('addresses')){
        // Count how many times each address appear
        let sameAddress = {};
        for (add of obj.addresses) {
          if(sameAddress.hasOwnProperty(add['address'])) {
            sameAddress[add['address']].push(obj.addresses.indexOf(add));
          }
          else {
            sameAddress[add['address']] = [obj.addresses.indexOf(add)];
          }
        }

        // Select only addresses which appears 2 or more times
        for (let i=Object.keys(sameAddress).length-1; i>=0; i--){
          if(sameAddress[Object.keys(sameAddress)[i]].length<2){
            delete sameAddress[Object.keys(sameAddress)[i]];
          }
        }

        // Do the merging
        let toSplice = [];
        for (add in sameAddress) {
          sameAddress[add].sort((a,b)=>a-b);
          for (let i=1;i<sameAddress[add].length;i++) {
            if(obj.addresses[sameAddress[add][0]].type ==
               obj.addresses[sameAddress[add][i]].type){ // Types are the same
                 // Merge tags
                 obj.addresses[sameAddress[add][0]].tags =
                 obj.addresses[sameAddress[add][0]].tags
                 .concat(obj.addresses[sameAddress[add][i]].tags);

                 toSplice.push(sameAddress[add][i]);
               }
          }
        }

        // Remove merged addresses
        toSplice.sort((a,b)=>a-b);
        let i;
        while((i=toSplice.pop()) !== undefined) {
          obj.addresses.splice(i, 1);
        }
      }

      /*****************************************/
      // Final 'invisible' sanitization
      if(typeof obj['invisible'] !== 'boolean') {
        obj['invisible'] = false;
      }
      /*****************************************/
      // Final 'see_all' sanitization
      if(typeof obj['see_all'] !== 'boolean') {
        obj['see_all'] = false;
      }
    }

    /****************************
     ** CREATE AND RETURN JSON **
     ****************************/
    console.log('Creating JSON file...');
    let jsonString = JSON.stringify(dataArr, null, 1);
    // Some minor presentation changes
    jsonString = jsonString.replace(/\[\s*{/g, '[{' );
    jsonString = jsonString.replace(/},\s*{/g, '}, {' );
    jsonString = jsonString.replace(/}\s*]/g, '}]' );

    let ws = fs.createWriteStream(outputFile);
    ws.write(jsonString);
    ws.end();
    console.log('Done!');
  });
