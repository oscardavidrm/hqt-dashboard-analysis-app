//User
import userQueries from './user/queries';
import userMutations from './user/mutations';

//Artisan
import artisanQueries from './artisan/queries';
import artisanMutations from './artisan/mutations';

//Origin
import originQueries from './origin/queries';
import originMutations from './origin/mutations';

//Location
import locationQueries from './location/queries';
import locationMutations from './location/mutations';

//Product
import productQueries from './product/queries';
import productMutations from './product/mutations';

//Garment
// import productQueries from './garment/queries';
import garmentMutations from './garment/mutations';

//ProductType
import productTypeQueries from './productType/queries';
import productTypeMutations from './productType/mutations';

//Transaction
import transactionQueries from './transaction/queries';
import transactionMutations from './transaction/mutations';

const resolvers = {
  Query: {
    ...userQueries,
    ...artisanQueries,
    ...originQueries,
    ...locationQueries,
    ...productQueries,
    ...productTypeQueries,
    ...transactionQueries,
  },
  Mutation: {
    ...userMutations,
    ...artisanMutations,
    ...originMutations,
    ...locationMutations,
    ...productMutations,
    ...garmentMutations,
    ...productTypeMutations,
    ...transactionMutations,
  },
};

export default resolvers;
