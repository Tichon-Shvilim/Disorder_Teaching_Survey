export interface DomainModel {
  _id?: string;      // MongoDB document ID (optional when creating)
  name: string;      // Domain name (required)
}