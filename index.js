const inquirer = require('inquirer')
const fs = require('fs')
const CURR_DIR = process.cwd();

const QUESTIONS = [
  {
    name: 'projectName',
    type: 'input',
    message: '请输入项目名称，由小写字母和中划线组成，如 my-project:',
    validate: input => /^[a-z]+[a-z\-]*[a-z]$/.test(input) ? true : '项目名称不符合命名规则'
  }
]

inquirer.prompt(QUESTIONS).then(answers => {
  console.log(answers)
  const {projectName} = answers;
  const templatePath = `${__dirname}/files`;
  fs.mkdirSync(`${CURR_DIR}/${projectName}`)
  createDirectoryContents(templatePath, projectName);
  process.exit();
})


function createDirectoryContents (templatePath, newProjectPath) {
  const filesToCreate = fs.readdirSync(templatePath);

  filesToCreate.forEach(file => {
    const origFilePath = `${templatePath}/${file}`;
    
    // get stats about the current file
    const stats = fs.statSync(origFilePath);

    if (stats.isFile()) {
      const contents = fs.readFileSync(origFilePath, 'utf8');
      const writePath = `${CURR_DIR}/${newProjectPath}/${file}`;
      fs.writeFileSync(writePath, contents, 'utf8');
    }else if(stats.isDirectory()) {
      const dirPath = `${newProjectPath}/${file}`;
      fs.mkdirSync(dirPath);
      createDirectoryContents(origFilePath, dirPath)
    }
  });
}