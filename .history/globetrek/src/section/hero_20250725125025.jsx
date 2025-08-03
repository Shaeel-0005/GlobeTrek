<section
  ref={containerRef}
  className="relative h-[250vh] overflow-hidden bg-white"
>
  {/* Fixed Navbar */}
  <div className="nav fixed top-0 left-0 w-full z-50">
    <Navbar />
  </div>

  {/* Sticky Title Text */}
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 1 }}
    className="sticky top-0 h-screen flex items-center justify-center z-10 pointer-events-none"
  >
    <h1 className="text-5xl md:text-7xl font-bold text-center">
      HIKING/
      <br />
      TREKKING
      <br />
      TOURS
    </h1>
  </motion.div>

  {/* Scrolling Images */}
  <motion.div
    style={{ y }}
    className="absolute top-0 left-0 w-full h-[200vh] z-0"
  >
    <div className="relative w-full h-full">
      <img
        src={Hero01}
        alt="Snow"
        className="absolute top-10 left-10 w-[30%] rounded-lg shadow-md"
      />
      <img
        src={Hero02}
        alt="Venice"
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-[30%] rounded-lg shadow-md"
      />
      <img
        src={Hero03}
        alt="Hiker"
        className="absolute top-20 right-10 w-[30%] rounded-lg shadow-md"
      />
    </div>
  </motion.div>

  {/* Bottom Content (after scroll ends) */}
  <div className="relative z-50 pt-[100vh]">
    <div className="container mx-auto px-4 flex justify-between">
      <div className="left-content w-[40%]">
        <p className="mb-4">
          Lorem ipsum, dolor sit amet consectetur adipisicing elit. Ut
          provident perferendis repellendus!
        </p>
        <button className="bg-black text-white px-4 py-2 rounded">
          Explore World
        </button>
      </div>
      <div className="right-content w-[40%]">
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
          voluptatum.
        </p>
      </div>
    </div>
  </div>
</section>
