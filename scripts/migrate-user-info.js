import UsersModel from '../app/databases/github-users/schema';
import UsersInfoModal from '../app/databases/github-users-info/schema';

const migrateUserInfo = async () => {
  try {
    const users = await UsersModel.find({});
    await Promise.all(users.map(async (user) => {
      const {
        orgs = [],
        login = '',
        starred = [],
        starredFetched = false,
        contributions = [],
      } = user;

      await UsersInfoModal.create({
        login,
        contributions,
        starred,
        starredFetched,
        organizations: orgs
      });

      console.log(`${login} migrate finished!`);
    }));

    await UsersModel.update({}, {
      $unset: {
        orgs: 1,
        starred: 1,
        starredFetched: 1,
        contributions: 1
      }
    });

    console.log('Migrate finished!');
  } catch (e) {
    console.log(e);
  }

  process.exit();
};

migrateUserInfo();
