<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmployeeInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public string $signedUrl)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Welcome to SmartLeave - Set Up Your Account')
            ->greeting("Hello {$notifiable->first_name},")
            ->line('You have been registered as an employee on SmartLeave.')
            ->line('To complete your profile setup and create your secure password, please click the button below:')
            ->action('Set Up Password', $this->signedUrl)
            ->line('This invitation link will expire in 24 hours.')
            ->line('If you did not expect this invitation, you can safely ignore this email.')
            ->salutation('Best regards, The SmartLeave Team');
    }
}
