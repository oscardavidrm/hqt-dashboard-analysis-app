import {gql} from 'apollo-boost';

const GET_TRANSACTIONS = gql`
  query transactions($filters: TransactionFilters!) {
    transactions(filters: $filters) {
      id
      type
      paymentMethod
      name
      description
      amount
      date
      product
    }
  }
`;

const GET_RESULTS = gql`
  query results($filters: TransactionResultsFilters!) {
    results(filters: $filters) {
      total
      ins
      outs
    }
  }
`;

export {GET_TRANSACTIONS, GET_RESULTS};
