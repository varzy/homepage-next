import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404',
};

export default function GlobalNotFound() {
  return <div>Whoops! It seems like you found a DEAD LINK.</div>;
}
