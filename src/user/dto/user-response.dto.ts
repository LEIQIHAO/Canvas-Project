import { User } from '../entities/user.entity';

// DTO for user data returned in API responses (matching original structure)
export class UserResponseDto {
  id: string;
  username: string;
  email: string;
  // createdAt: Date; // Removed createdAt to match original response

  constructor(user: User) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    // this.createdAt = user.createdAt; // Removed createdAt
  }
}
