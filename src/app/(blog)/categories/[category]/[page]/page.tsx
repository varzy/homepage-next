import { redirect } from 'next/navigation';

interface PageProps {
  params: { category: string; page: number };
}

export function generateMetadata({ params }: PageProps) {
  return {
    title: params.category,
  };
}

export default function Page({ params }: PageProps) {
  const { category, page } = params;

  return (
    <div>
      <div>{category}</div>
      <div>{page}</div>
    </div>
  );
}
