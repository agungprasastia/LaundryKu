/**
 * Notification object
 */
export interface Notification {
  notification_id: string;
  user_id: string;
  title?: string;
  message: string;
  type?: string;
  reference_id?: string;
  is_read: boolean | number;
  created_at?: string;
}
