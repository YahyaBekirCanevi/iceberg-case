export enum TransactionStatus {
  AGREEMENT = 'agreement',
  EARNEST_MONEY = 'earnest_money',
  TITLE_DEED = 'title_deed',
  COMPLETED = 'completed',
}

export enum AgentRole {
  LISTING = 'listing',
  SELLING = 'selling',
  BOTH = 'both', // Scenario 1: Listing & Selling are the same
}