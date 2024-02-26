import { redirect } from 'next/navigation';

interface PageProps {
  params: { category: string };
}

export function generateMetadata({ params }: PageProps) {
  return {
    title: params.category,
  };
}

export default function Page({ params }: PageProps) {
  const { category } = params;

  return (
    <div>
      <div>{category}</div>
    </div>
  );
}
