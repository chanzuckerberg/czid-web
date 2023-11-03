const commander = require('commander')
const fs = require('fs')
const child_process = require('child_process')
commander
  .option("-f, --filepath <filepath>", "file containing typescript errors")
  .option("--dryrun", "a dry run");

  commander.parse(process.argv);
  if (!commander.filepath) {
    throw new Error("filepath is required");
  }

  const getReplaceString = (error) => {
    //get characters before @ts-expect-error
    const charactersBeforeExpectError = error.split('@ts-expect-error')[0];
    if (charactersBeforeExpectError.includes("?") || charactersBeforeExpectError.includes(":")) {
      // remove // from the string
      const replaceCharacters = error.split('//')[0];
      return replaceCharacters;
    }
    return '';
  }

  const file = fs.readFileSync(commander.filepath, { encoding: "utf8" });
  const matchesPerFile = {};
  const matches = file.split('\n').filter(match => match).map(match => {  
    // splits on ':' but not on ': //'
    return match.split(/(?!: \/\/):/)});
  matches.forEach(match => {
    const thisMatch = {
      filePath: match[0],
      lineNumber: match[1],
      error: match[2],
      replace: getReplaceString(match[2]),
    };

    matchesPerFile[thisMatch.filePath] = (
      matchesPerFile[thisMatch.filePath] || []
    ).concat([thisMatch]);
  })
  const totalFiles = Object.keys(matchesPerFile).length;

  if (commander.dryrun) {
    console.log(matchesPerFile);
    console.log("Total files: ", totalFiles);
  }

  let nProcessing = 1;
  Object.keys(matchesPerFile).forEach(file => {
    if (!commander.hidecommands) {
      console.log(`Processing ${nProcessing} of ${totalFiles}`);
    }
    // if one or more of the matches in a file have a replace string
    // then seperate the matches into seperate commands
    if (matchesPerFile[file].some(match => match.replace)) {
      matchesPerFile[file].forEach(match => {
          const commandString = `sed -i '' '${match.lineNumber}s/.*/${match.replace}/' ${file}`;
          if (!commander.dryrun) {
            child_process.execSync(commandString);
          } else if (!commander.hidecommands) {
            console.log("Dry run:\n", commandString);
          }
      });
      nProcessing += 1;
      return;
    }


    // otherwise, just run one command for the file
    let commandString = matchesPerFile[file].reduce((memo, match) => {
      return memo + generateCommand(match);
    }, `sed -i '' '`);
  
    commandString += `' ${file}`;
    if (!commander.dryrun) {
      child_process.execSync(commandString);
    } else if (!commander.hidecommands) {
      console.log("Dry run:\n", commandString);
    }
    nProcessing += 1;
  });
  
  function generateCommand(match) {
    return `${match.lineNumber}d;`;
  }
  