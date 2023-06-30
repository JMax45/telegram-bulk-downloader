import inquirer, { Question } from 'inquirer';

const ask = async (q: string, additionalParams?: Question<any>) => {
  return await (
    await inquirer.prompt([
      {
        name: 'data',
        message: q,
        ...additionalParams,
      },
    ])
  ).data;
};

export default ask;
