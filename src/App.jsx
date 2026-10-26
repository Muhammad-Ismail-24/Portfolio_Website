import { lazy, Suspense } from 'react'
import { ReactLenis } from '@studio-freight/react-lenis'
import Layout from './components/layout/Layout';
import Navbar from './components/layout/Navbar';
import Terminal from './components/layout/Terminal';
import Footer from './components/layout/Footer';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import Products from './components/sections/Products';
import ProjectNetwork from './components/sections/ProjectNetwork';
import Capabilities from './components/sections/Capabilities';
import Services from './components/sections/Services';
import Contact from './components/sections/Contact';

// the three.js background loads in its own chunk, after the page has painted
const StaticNeuromesh = lazy(() => import('./components/layout/StaticNeuromesh'));

export default function App() {
  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1.2 }}>
      <Layout>
        <Suspense fallback={null}><StaticNeuromesh/></Suspense>
        <Navbar/>
        <Hero/>
        <About/>
        <Products/>
        <ProjectNetwork/>
        <Capabilities/>
        <Services/>
        <Contact/>
        <Footer/>
      </Layout>
      <Terminal/>
    </ReactLenis>
  );
}
