import type { Joke } from '@prisma/client';
import { Link } from '@remix-run/react';

type JokeProps = {
  joke: Pick<Joke, 'name' | 'content'>;
  isOwner: boolean;
  canDelete?: boolean;
};

export default function JokeDisplay({ joke, isOwner, canDelete = true }: JokeProps) {
  return (
    <div>
      <p>Here's your hilarious joke:</p>
      <p>{joke.content}</p>
      <Link to=".">{joke.name} Permalink</Link>
      {isOwner ? (
        <form method="post">
          <input type="hidden" name="_method" value="delete" />
          <button type="submit" className="button" disabled={!canDelete}>
            Delete
          </button>
        </form>
      ) : null}
    </div>
  );
}
