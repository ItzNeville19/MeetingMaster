'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Particle Background
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Particle {
      x: number = 0;
      y: number = 0;
      vx: number = 0;
      vy: number = 0;
      radius: number = 1;
      color: string = 'rgba(0, 113, 227, 0.5)';

      constructor() {
        if (!canvas) return;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = Math.random() * 2 + 1;
        this.color = `rgba(0, 113, 227, ${0.2 + Math.random() * 0.3})`;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (!canvas) return;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 100; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.update();
        p.draw();

        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 100 && ctx) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 113, 227, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f172a 100%)' }}
    />
  );
}

export default function ProjectsPage() {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    window.open('https://rayze.xyz', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen relative overflow-hidden cursor-pointer" onClick={handleClick}>
      <ParticleBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="text-center px-6"
        >
          <motion.div
            animate={{ 
              scale: isHovered ? 1.05 : 1,
              rotate: isHovered ? 2 : 0
            }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="mb-8"
          >
            <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0071e3] via-[#0077ed] to-[#0071e3] mb-6">
              Rayze.xyz
            </h1>
            <div className="text-3xl md:text-4xl text-white/90 font-semibold mb-4">
              AI-Powered Compliance Platform
            </div>
          </motion.div>
          
          <motion.div
            animate={{ y: isHovered ? -10 : 0 }}
            className="mb-8"
          >
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-8 leading-relaxed">
              Transform your compliance process with AI-powered document analysis, 
              real-time risk monitoring, and automated reporting.
            </p>
            
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#0071e3] to-[#0077ed] rounded-full font-bold text-lg text-white shadow-2xl">
              <span>Click to visit Rayze.xyz</span>
              <motion.span
                animate={{ x: isHovered ? 5 : 0 }}
                transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }}
              >
                →
              </motion.span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0.7 }}
            className="text-white/60 text-sm"
          >
            Trusted by 500+ companies worldwide
          </motion.div>
        </motion.div>
      </div>

      {/* Floating elements */}
      <motion.div
        className="absolute top-20 right-20 text-6xl opacity-20"
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 10, 0]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        🤖
      </motion.div>
      <motion.div
        className="absolute bottom-20 left-20 text-6xl opacity-20"
        animate={{ 
          y: [0, 20, 0],
          rotate: [0, -10, 0]
        }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      >
        ⚡
      </motion.div>
      <motion.div
        className="absolute top-1/2 right-10 text-5xl opacity-20"
        animate={{ 
          x: [0, 15, 0],
          rotate: [0, 15, 0]
        }}
        transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
      >
        📊
      </motion.div>
    </div>
  );
}
