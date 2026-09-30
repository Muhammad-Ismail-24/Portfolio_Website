import { ReactLenis } from '@studio-freight/react-lenis'
import Layout from './components/layout/Layout';
import Navbar from './components/layout/Navbar';
import StaticNeuromesh from './components/layout/StaticNeuromesh';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import Products from './components/sections/Products';
import FeaturedProjects from './components/sections/FeaturedProjects';
import Capabilities from './components/sections/Capabilities';
import Services from './components/sections/Services';
import Contact from './components/sections/Contact';

export default function App() {
  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1.2 }}>
      <Layout>
        <StaticNeuromesh/>
        <Navbar/>
        <Hero/>
        <About/>
        <Products/>
        <FeaturedProjects/>
        <Capabilities/>
        <Services/>
        <Contact/>
      </Layout>
    </ReactLenis>
  );
}
