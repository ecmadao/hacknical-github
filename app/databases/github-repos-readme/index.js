import GitHubReposReadme from './schema';

const findReadme = async full_name =>
  await GitHubReposReadme.findOne({ full_name });

const findReadmes = async full_names =>
  await GitHubReposReadme.find({
    full_name: {
      $in: full_names
    }
  });

const insertReadme = async (options) => {
  const { full_name, readme } = options;
  return await GitHubReposReadme.create({
    readme,
    full_name,
  });
};

const updateReadme = async (options) => {
  const {
    readme,
    full_name,
  } = options;

  let result = await findReadme(full_name);
  if (result) {
    result.readme = readme;
    await result.save();
  } else {
    result = await insertReadme(options);
  }

  return result;
};

export default {
  findOne: findReadme,
  find: findReadmes,
  update: updateReadme,
};
