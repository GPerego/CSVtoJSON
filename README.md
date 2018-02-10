# CSV to JSON
Program made in [Node.js](https://nodejs.org/) to parse and convert a specific csv into a JSON file. </br>
Made for an internship selection process :)
## Usage
`node csvtojson.js PATH_TO_INPUT PATH_TO_OUTPUT`
* *`PATH_TO_INPUT`*: Path to input csv. *Default: `input.csv`*
* *`PATH_TO_OUTPUT`*: Path to output JSON. *Default: `output.jso`n*
### Example
#### input.csv
`fullname,eid,class,class,"email Responsável, Pai",phone Pai,"phone Responsável, Mãe",email Mãe,email Aluno,phone Aluno,invisible,see_all
John Doe 1,1234,Sala 1 / Sala 2,Sala 3,johndoepai1@gmail.com :),11 22221,(11) 38839332,johndoemae1@gmail.com,johndoealuno1@gmail.com,hahaha,1,
John Doe 1,1234,Sala 4,"Sala 5, Sala 6",johndoepai2@gmail.com/johndoepai3@gmail.com,19 985504400,(11) 38839333,11 983340440,,,,yes
Mary Doe 2,1235,Sala 1,,marydoe1@gmail.com,,(11) 98334228,,,,0,no
Victor Doe 3,1236,Sala 6,Sala 7,victordoepai1@hotmail.com,,,victordoe3@gmail.com,victordoe3@gmail.com,19 74430033,,`
#### output.json
`[{
  "fullname": "John Doe 1",
  "eid": "1234",
  "classes": [
    "Sala 1",
    "Sala 2",
    "Sala 3",
    "Sala 4",
    "Sala 5",
    "Sala 6"
  ],
  "addresses": [{
    "type": "phone",
    "tags": [
      "Responsável",
      "Mãe"
    ],
    "address": "551138839332"
  }, {
    "type": "email",
    "tags": [
      "Mãe"
    ],
    "address": "johndoemae1@gmail.com"
  }, {
    "type": "email",
    "tags": [
      "Aluno"
    ],
    "address": "johndoealuno1@gmail.com"
  }, {
    "type": "email",
    "tags": [
      "Responsável",
      "Pai"
    ],
    "address": "johndoepai2@gmail.com"
  }, {
    "type": "email",
    "tags": [
      "Responsável",
      "Pai"
    ],
    "address": "johndoepai3@gmail.com"
  }, {
    "type": "phone",
    "tags": [
      "Pai"
    ],
    "address": "5519985504400"
  }, {
    "type": "phone",
    "tags": [
      "Responsável",
      "Mãe"
    ],
    "address": "551138839333"
  }],
  "invisible": true,
  "see_all": true
}, {
  "fullname": "Mary Doe 2",
  "eid": "1235",
  "classes": "Sala 1",
  "addresses": [{
    "type": "email",
    "tags": [
      "Responsável",
      "Pai"
    ],
    "address": "marydoe1@gmail.com"
  }],
  "invisible": false,
  "see_all": false
}, {
  "fullname": "Victor Doe 3",
  "eid": "1236",
  "classes": [
    "Sala 6",
    "Sala 7"
  ],
  "addresses": [{
    "type": "email",
    "tags": [
      "Responsável",
      "Pai"
    ],
    "address": "victordoepai1@hotmail.com"
  }, {
    "type": "email",
    "tags": [
      "Mãe",
      "Aluno"
    ],
    "address": "victordoe3@gmail.com"
  }, {
    "type": "phone",
    "tags": [
      "Aluno"
    ],
    "address": "551974430033"
  }],
  "invisible": false,
  "see_all": false
}]`
## Dependencies
### fast-csv
[Link to Repository](https://github.com/C2FO/fast-csv)
#### Installation
`npm install fast-csv`
### email-validator
[Link to Repository](https://github.com/Sembiance/email-validator)
#### Installation
`npm install email-validator`
### google-libphonenumber
[Link to Repository](https://github.com/ruimarinho/google-libphonenumber)
#### Installation
`npm install google-libphonenumber`
