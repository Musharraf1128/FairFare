const Footer = () => {
  return (
    <footer className="bg-white border-t mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 text-sm">
              © 2025 TripSplit. Built with ❤️ using MERN Stack
            </p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition">
              About
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition">
              Privacy
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
