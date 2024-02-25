export default function CategoryPage({ params }: { params: { category: string; slug: string } }) {
  return (
    <div>
      <div>category: {params.category}</div>
      <div>slug: {params.slug}</div>
    </div>
  );
}
