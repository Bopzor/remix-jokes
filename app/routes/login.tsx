import type { ActionFunction, LinksFunction, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useActionData, useSearchParams } from '@remix-run/react';
import { db } from '~/utils/db.server';
import { createUserSession, login, register } from '~/utils/session.server';

import stylesUrl from '../styles/login.css';

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: stylesUrl }];
};

export const meta: MetaFunction = () => {
  return {
    title: 'Remix Jokes | Login',
    description: 'Login to submit your own jokes to Remix Jokes!',
  };
};

const validateContentLength = (
  { content, field }: { content: string; field: string },
  minLength: number
) => {
  if (content.length < minLength) {
    return `${field} must be at least ${minLength} characters long`;
  }
};

function validateUrl(url: any) {
  console.log(url);
  const urls = ['/jokes', '/', 'https://remix.run'];

  if (urls.includes(url)) {
    return url;
  }

  return '/jokes';
}

type ActionData = {
  formError?: string;
  fieldErrors?: {
    username: string | undefined;
    password: string | undefined;
  };
  fields?: {
    username: string;
    password: string;
  };
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();

  const loginType = body.get('loginType');
  const username = body.get('username');
  const password = body.get('password');
  const redirectTo = validateUrl(body.get('redirectTo') || '/jokes');

  if (
    typeof loginType !== 'string' ||
    typeof redirectTo !== 'string' ||
    typeof username !== 'string' ||
    typeof password !== 'string'
  ) {
    return badRequest({
      formError: `Form not submitted correctly.`,
    });
  }

  const fieldErrors = {
    username: validateContentLength({ content: username, field: 'Username' }, 3),
    password: validateContentLength({ content: password, field: 'Password' }, 6),
  };

  const fields = { username, password };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields });
  }

  switch (loginType) {
    case 'login': {
      const user = await login(username, password);

      if (!user) {
        return badRequest({
          fields,
          formError: 'Invalid credentials',
        });
      }

      return createUserSession(user.id, '/');
    }
    case 'register': {
      const userExists = await db.user.findFirst({
        where: { username },
      });

      if (userExists) {
        return badRequest({
          fields,
          formError: `User with username ${username} already exists`,
        });
      }

      const user = await register(username, password);

      if (!user) {
        return badRequest({
          fields,
          formError: `Something went wrong trying to create a new user.`,
        });
      }

      return createUserSession(user.id, '/jokes');
    }
    default: {
      return badRequest({
        fields,
        formError: `Login type invalid`,
      });
    }
  }
};

export default function Login() {
  const [searchParams] = useSearchParams();

  const actionData = useActionData<ActionData>();

  return (
    <div className="container">
      <div className="content" data-light="">
        <h1>Login</h1>

        <form method="post">
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get('redirectTo') ?? undefined}
          />

          <fieldset>
            <legend className="sr-only">Login or Register?</legend>
            <label>
              <input type="radio" name="loginType" value="login" defaultChecked /> Login
            </label>
            <label>
              <input type="radio" name="loginType" value="register" /> Register
            </label>
          </fieldset>

          <div>
            <label htmlFor="username-input">Username</label>
            <input
              type="text"
              id="username-input"
              name="username"
              aria-invalid={Boolean(actionData?.fieldErrors?.username)}
              aria-errormessage={actionData?.fieldErrors?.username ? 'username-error' : undefined}
            />
            {actionData?.fieldErrors?.username ? (
              <p className="form-validation-error" role="alert" id="username-error">
                {actionData.fieldErrors.username}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password-input">Password</label>
            <input
              id="password-input"
              name="password"
              type="password"
              aria-invalid={Boolean(actionData?.fieldErrors?.password)}
              aria-errormessage={actionData?.fieldErrors?.password ? 'password-error' : undefined}
            />
            {actionData?.fieldErrors?.password ? (
              <p className="form-validation-error" role="alert" id="name-error">
                {actionData.fieldErrors.password}
              </p>
            ) : null}
          </div>

          <button type="submit" className="button">
            Submit
          </button>
        </form>
      </div>
      <div className="links">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/jokes">Jokes</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
