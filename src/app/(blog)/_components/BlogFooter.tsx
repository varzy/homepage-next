export default function BlogFooter() {
  return (
    <footer>
      <div className="g-content-container">
        <hr className="border-gray-200" />
        <div className="py-4 text-sm leading-6">&copy; 2015 - {new Date().getFullYear()}</div>
      </div>
    </footer>
  );
}
