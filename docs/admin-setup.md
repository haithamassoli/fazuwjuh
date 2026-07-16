# Admin Setup

To grant admin privileges to your first user, follow these steps:

## 1. Register a User Account

Navigate to `/register` and create a new account with your email address and password.

## 2. Promote the User to Admin

Once registered, use the Convex `promote` mutation to grant admin role to the user. This is an internal Convex mutation not exposed to the client.

For the development deployment, run:

```bash
npx convex run users:promote '{"email":"<their-email>"}'
```

For the production deployment, add the `--prod` flag:

```bash
npx convex run users:promote '{"email":"<their-email>"}'  --prod
```

Replace `<their-email>` with the email address of the user you registered in step 1.

## 3. Verify Admin Access

Log in with the promoted user account and navigate to `/admin`. If the page loads successfully, admin privileges have been granted.

## Note

The `promote` mutation is an internal Convex function and cannot be called directly from the browser or client code. It must be invoked via the Convex CLI as shown above.
