import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="container">
        <Home />
      </main>
      <Footer />
    </div>
  );
}