import Layout from './components/layout/Layout';
import Navbar from './components/layout/Navbar';
import StaticNeuromesh from './components/layout/StaticNeuromesh';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import Products from './components/sections/Products';

export default function App() {
  return (
    <Layout>
      <StaticNeuromesh/>
      <Navbar/>
      <Hero/>
      <About/>
      <Products/>
    </Layout>
  );
}
