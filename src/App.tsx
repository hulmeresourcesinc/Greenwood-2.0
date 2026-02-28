import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map as MapIcon, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Plus, 
  Info, 
  AlertTriangle, 
  ChevronRight,
  User as UserIcon,
  Search,
  Lock,
  Globe,
  Edit,
  Sparkles,
  Loader2,
  ExternalLink,
  Calendar,
  Grid,
  Layers,
  TreePine,
  Droplets,
  Sprout,
  Trash2,
  Save,
  X,
  Box
} from 'lucide-react';
import { User, Project, FeedItem, JoinRequest } from './types';
import { US_STATES } from './constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Components ---

const Sidebar = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => {
  return (
    <div className="w-64 bg-earth-900 text-earth-100 flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-6 border-bottom border-earth-800">
        <h1 className="text-xl font-bold text-forest-300 flex items-center gap-2">
          <Globe className="w-6 h-6" />
          LocalCoord
        </h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-earth-800 transition-colors">
          <MapIcon className="w-5 h-5" />
          Project Map
        </Link>
        {user && (
          <>
            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-earth-800 transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
            <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-earth-800 transition-colors">
              <Settings className="w-5 h-5" />
              Profile
            </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-earth-800">
        {user ? (
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-900/20 text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        ) : (
          <Link to="/login" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-forest-600 hover:bg-forest-500 text-white transition-colors">
            <UserIcon className="w-5 h-5" />
            Login / Join
          </Link>
        )}
      </div>
    </div>
  );
};

const InfoFeed = ({ user }: { user: User | null }) => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.zipcode) {
      setFeed([{ id: 1, type: 'News', title: 'Welcome to LocalCoord', content: 'Set your zipcode in your profile to see hyper-local updates.' }]);
      return;
    }

    setIsLoading(true);
    const params = new URLSearchParams({
      zipcode: user.zipcode,
      land_zone: user.land_zone || ''
    });

    fetch(`/api/feed?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setFeed(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [user?.zipcode, user?.land_zone]);

  return (
    <div className="w-80 bg-earth-100 border-l border-earth-200 h-screen fixed right-0 top-0 overflow-y-auto p-6 hidden lg:block">
      <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
        <Info className="w-5 h-5 text-forest-600" />
        Local Updates
      </h2>
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-earth-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-xs">Fetching local data...</p>
          </div>
        ) : (
          feed.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-earth-200 group hover:border-forest-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {item.type === 'Warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Calendar className="w-4 h-4 text-forest-500" />
                  )}
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider font-bold",
                    item.type === 'Warning' ? "text-amber-600" : "text-forest-600"
                  )}>
                    {item.type}
                  </span>
                </div>
                {item.url && (
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-earth-400 hover:text-forest-600 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <h3 className="font-bold text-sm mb-1 leading-tight">{item.title}</h3>
              <p className="text-xs text-earth-600 leading-relaxed mb-2">{item.content}</p>
              {item.url && (
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-forest-600 flex items-center gap-1 hover:underline"
                >
                  View Event Details <ChevronRight className="w-3 h-3" />
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Pages ---

const MapUpdater = ({ center, radius }: { center: [number, number] | null, radius: number }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      // Calculate bounds for the circle to fit it in view
      const circle = L.circle(center, { radius: radius * 1609.34 });
      map.fitBounds(circle.getBounds(), { padding: [20, 20] });
    }
  }, [center, radius, map]);
  return null;
};

const ProjectPlanner = ({ project, onClose, onSave }: { project: Project, onClose: () => void, onSave: (grid: string) => void }) => {
  const [grid, setGrid] = useState<Record<string, any>>(project.grid_map ? JSON.parse(project.grid_map) : {});
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [customItem, setCustomItem] = useState('');
  const [activeCategory, setActiveCategory] = useState<'structures' | 'produce' | 'trees' | 'supplements'>('structures');

  const categories = {
    structures: [
      { id: 'raised-bed', label: 'Raised Bed', color: 'bg-amber-700', icon: Box },
      { id: 'hydro', label: 'Hydroponics', color: 'bg-blue-500', icon: Droplets },
      { id: 'aqua', label: 'Aquaponics', color: 'bg-cyan-600', icon: Droplets },
    ],
    produce: [
      { id: 'tomato', label: 'Tomato', color: 'bg-red-500', icon: Sprout },
      { id: 'pepper', label: 'Pepper', color: 'bg-orange-500', icon: Sprout },
      { id: 'herbs', label: 'Herbs', color: 'bg-emerald-500', icon: Sprout },
    ],
    trees: [
      { id: 'fruit-tree', label: 'Fruit Tree', color: 'bg-forest-700', icon: TreePine },
      { id: 'shade-tree', label: 'Shade Tree', color: 'bg-forest-900', icon: TreePine },
    ],
    supplements: [
      { id: 'mulch', label: 'Mulch', color: 'bg-stone-600', icon: Layers },
      { id: 'compost', label: 'Compost', color: 'bg-stone-800', icon: Layers },
    ]
  };

  const handleCellClick = (x: number, y: number) => {
    const key = `${x},${y}`;
    if (grid[key]) {
      const newGrid = { ...grid };
      delete newGrid[key];
      setGrid(newGrid);
    } else if (selectedItem) {
      setGrid({ ...grid, [key]: selectedItem });
    }
  };

  const addCustomItem = () => {
    if (!customItem.trim()) return;
    const newItem = { id: `custom-${Date.now()}`, label: customItem, color: 'bg-indigo-500', icon: Plus };
    setSelectedItem(newItem);
    setCustomItem('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-earth-900/90 backdrop-blur-md flex items-center justify-center p-8"
    >
      <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex border border-white/20">
        {/* Sidebar Palette */}
        <div className="w-80 bg-earth-50 border-r border-earth-200 flex flex-col">
          <div className="p-8 border-b border-earth-200">
            <h2 className="text-2xl font-bold text-earth-900 flex items-center gap-2">
              <Grid className="w-6 h-6 text-forest-600" />
              Project Planner
            </h2>
            <p className="text-sm text-earth-500 mt-1">Map out your garden layout</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Categories */}
            <div className="flex gap-2 p-1 bg-earth-200 rounded-xl">
              {(['structures', 'produce', 'trees', 'supplements'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    activeCategory === cat ? "bg-white text-forest-700 shadow-sm" : "text-earth-500 hover:text-earth-700"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {categories[activeCategory].map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center",
                    selectedItem?.id === item.id 
                      ? "border-forest-500 bg-forest-50 shadow-inner" 
                      : "border-transparent bg-white hover:border-earth-300"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg", item.color)}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-earth-700">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Custom Item */}
            <div className="pt-4 border-t border-earth-200">
              <label className="block text-[10px] font-bold text-earth-400 uppercase mb-2">Add Custom Item</label>
              <div className="flex gap-2">
                <input 
                  value={customItem}
                  onChange={e => setCustomItem(e.target.value)}
                  placeholder="Item name..."
                  className="flex-1 px-4 py-2 rounded-xl border border-earth-200 text-sm focus:ring-2 focus:ring-forest-500 outline-none"
                />
                <button 
                  onClick={addCustomItem}
                  className="p-2 bg-forest-600 text-white rounded-xl hover:bg-forest-500 transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border-t border-earth-200 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-earth-500 hover:bg-earth-50 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => onSave(JSON.stringify(grid))}
              className="flex-1 py-3 bg-forest-600 text-white rounded-xl font-bold hover:bg-forest-500 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Map
            </button>
          </div>
        </div>

        {/* Grid Area */}
        <div className="flex-1 bg-earth-900 p-12 overflow-auto flex items-center justify-center relative">
          <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1 p-4 bg-earth-800/50 rounded-3xl border border-white/5">
            {Array.from({ length: 15 * 15 }).map((_, i) => {
              const x = i % 15;
              const y = Math.floor(i / 15);
              const key = `${x},${y}`;
              const item = grid[key];
              return (
                <button
                  key={key}
                  onClick={() => handleCellClick(x, y)}
                  className={cn(
                    "w-12 h-12 rounded-lg transition-all flex items-center justify-center group relative",
                    item ? item.color : "bg-earth-800 hover:bg-earth-700"
                  )}
                >
                  {item && (
                    <div className="text-white text-[10px] font-bold">
                      {item.label[0]}
                    </div>
                  )}
                  {!item && selectedItem && (
                    <div className={cn("absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20", selectedItem.color)} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="absolute bottom-8 right-8 bg-black/50 backdrop-blur p-4 rounded-2xl border border-white/10 text-white pointer-events-none">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">Controls</p>
            <ul className="text-xs space-y-1">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-forest-500" />
                Click empty: Place {selectedItem?.label || 'selected'}
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Click block: Remove
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const LocationMarker = () => {
  const map = useMap();
  const [position, setPosition] = useState<L.LatLng | null>(null);

  const handleClick = () => {
    map.locate().on("locationfound", function (e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    });
  };

  return (
    <button 
      onClick={handleClick}
      className="absolute bottom-10 right-10 z-[1000] bg-white p-3 rounded-full shadow-xl border border-earth-200 hover:bg-earth-100 transition-colors"
      title="Find my location"
    >
      <MapIcon className="w-6 h-6 text-forest-600" />
    </button>
  );
};

const KANSAS_MISSOURI_BOUNDS: L.LatLngBoundsExpression = [
  [35.99, -102.05], // Southwest corner
  [40.61, -89.10]   // Northeast corner
];

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const LandingPage = ({ user }: { user: User | null }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState(30);
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/projects?userId=${user?.id || ''}`)
      .then(res => res.json())
      .then(setProjects);
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) {
      setSearchCenter(null);
      return;
    }

    // If it looks like a zipcode (5 digits)
    if (/^\d{5}$/.test(search)) {
      setIsSearching(true);
      try {
        // Restrict geocoding to USA and specifically look for zipcodes
        // We can also add viewbox to prioritize KS/MO
        const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${search}&country=USA&format=json&viewbox=-102.05,40.61,-89.10,35.99&bounded=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          setSearchCenter([parseFloat(lat), parseFloat(lon)]);
        } else {
          alert("Zipcode not found in Kansas or Missouri");
        }
      } catch (error) {
        console.error("Geocoding failed:", error);
      } finally {
        setIsSearching(false);
      }
    } else {
      // Basic text search handled by filtering the list
      setSearchCenter(null);
    }
  };

  const filteredProjects = projects.filter(p => {
    // If we have a search center and it's a radius search
    if (searchCenter && /^\d{5}$/.test(search)) {
      const dist = getDistance(searchCenter[0], searchCenter[1], p.lat, p.lng);
      return dist <= radius;
    }
    // Otherwise basic text search
    if (search) {
      return p.name.toLowerCase().includes(search.toLowerCase()) || 
             p.description.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  return (
    <div className="h-screen relative ml-64 mr-80">
      <div className="absolute top-6 left-6 right-6 z-10 space-y-4">
        <div className="flex gap-4">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by Zipcode (e.g. 64101) or Project Name..."
              className="w-full pl-12 pr-12 py-3 bg-white/90 backdrop-blur shadow-lg rounded-2xl border border-earth-200 focus:outline-none focus:ring-2 focus:ring-forest-500"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!e.target.value) setSearchCenter(null);
              }}
            />
            {search && (
              <button 
                type="button"
                onClick={() => {
                  setSearch('');
                  setSearchCenter(null);
                }}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            )}
            {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-forest-600" />}
          </form>
          {user && (
            <button 
              onClick={() => navigate('/create')}
              className="bg-forest-600 text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-forest-500 transition-all flex items-center gap-2 font-bold whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
          )}
        </div>

        {/^\d{5}$/.test(search) && (
          <div className="bg-white/90 backdrop-blur p-4 rounded-2xl shadow-lg border border-earth-200 flex items-center gap-6 w-fit mx-auto">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-earth-600 uppercase tracking-wider">Radius:</span>
              <span className="text-sm font-bold text-forest-700 w-12">{radius} mi</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="50" 
              step="1"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-48 h-2 bg-earth-200 rounded-lg appearance-none cursor-pointer accent-forest-600"
            />
            <div className="flex justify-between w-full text-[10px] font-bold text-earth-400 absolute -bottom-5 left-0 px-2 pointer-events-none">
              <span>5mi</span>
              <span>50mi</span>
            </div>
          </div>
        )}
      </div>

      <MapContainer 
        center={[39.0997, -94.5786]} 
        zoom={7} 
        className="h-full w-full"
        maxBounds={KANSAS_MISSOURI_BOUNDS}
        minZoom={6}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker />
        <MapUpdater center={searchCenter} radius={radius} />
        {filteredProjects.map(p => (
          <Marker key={p.id} position={[p.lat, p.lng]}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                <p className="text-sm text-earth-600 mb-3 line-clamp-2">{p.description}</p>
                <Link 
                  to={`/project/${p.id}`}
                  className="block text-center bg-forest-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-forest-500"
                >
                  View Project
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
        {searchCenter && (
          <Circle 
            center={searchCenter} 
            radius={radius * 1609.34} // miles to meters
            pathOptions={{ color: '#059669', fillColor: '#059669', fillOpacity: 0.1 }}
          />
        )}
      </MapContainer>
    </div>
  );
};

const ProjectProfile = ({ user }: { user: User | null }) => {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/${id}?userId=${user?.id || ''}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setProject(data);
        setLoading(false);
      })
      .catch(() => {
        setProject(null);
        setLoading(false);
      });
  }, [id, user?.id]);

  const handleJoin = async () => {
    if (!user) return alert('Please login first');
    await fetch(`/api/projects/${id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });
    setRequested(true);
  };

  const handleSaveMap = async (gridMap: string) => {
    if (!project || !user) return;
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...project, grid_map: gridMap, userId: user.id })
    });
    if (res.ok) {
      setProject({ ...project, grid_map: gridMap });
      setShowPlanner(false);
    }
  };

  if (loading) return <div className="ml-64 p-12">Loading...</div>;
  if (!project) return <div className="ml-64 p-12">Project not found or private.</div>;

  return (
    <div className="ml-64 mr-80 p-12 max-w-4xl">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-earth-200">
        <div className="h-48 bg-forest-900 relative">
          <div className="absolute inset-0 opacity-30 bg-[url('https://picsum.photos/seed/garden/1200/400')] bg-cover bg-center" />
          <div className="absolute bottom-6 left-8 text-white">
            <div className="flex items-center gap-2 mb-2">
              {project.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                {project.is_public ? 'Public Project' : 'Private Project'}
              </span>
            </div>
            <h1 className="text-4xl font-bold">{project.name}</h1>
          </div>
          {user?.id === project.owner_id && (
            <div className="absolute top-6 right-8 flex gap-2">
              <button 
                onClick={() => setShowPlanner(true)}
                className="bg-white/20 backdrop-blur hover:bg-white/40 text-white p-3 rounded-full transition-all"
                title="Project Planner"
              >
                <Grid className="w-5 h-5" />
              </button>
              <Link 
                to={`/project/${project.id}/edit`}
                className="bg-white/20 backdrop-blur hover:bg-white/40 text-white p-3 rounded-full transition-all"
                title="Edit Project"
              >
                <Edit className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>

        <div className="p-8 grid grid-cols-3 gap-12">
          <div className="col-span-2 space-y-12">
            <section>
              <h2 className="text-sm font-bold text-forest-600 uppercase tracking-widest mb-3">About</h2>
              <p className="text-earth-700 leading-relaxed text-lg">{project.description}</p>
            </section>

            {project.grid_map && (
              <section>
                <h2 className="text-sm font-bold text-forest-600 uppercase tracking-widest mb-3">Project Layout</h2>
                <div className="bg-earth-900 p-6 rounded-3xl border border-earth-800 overflow-x-auto shadow-inner">
                  <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1 w-fit mx-auto">
                    {(() => {
                      const grid = JSON.parse(project.grid_map);
                      return Array.from({ length: 15 * 15 }).map((_, i) => {
                        const x = i % 15;
                        const y = Math.floor(i / 15);
                        const key = `${x},${y}`;
                        const item = grid[key];
                        return (
                          <div
                            key={key}
                            className={cn(
                              "w-5 h-5 rounded-sm flex items-center justify-center text-[6px] font-bold text-white",
                              item ? item.color : "bg-earth-800/30"
                            )}
                          >
                            {item && item.label[0]}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </section>
            )}

            <section>
              <h2 className="text-sm font-bold text-forest-600 uppercase tracking-widest mb-3">Goals</h2>
              <div className="bg-earth-50 p-6 rounded-2xl border border-earth-200 space-y-4">
                {project.sub_goals && project.sub_goals.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-earth-200">
                    {project.sub_goals.map(goal => (
                      <span key={goal} className="px-3 py-1 bg-forest-100 text-forest-700 rounded-full text-xs font-bold border border-forest-200">
                        {goal}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-earth-800 whitespace-pre-wrap">{project.goals}</p>
              </div>
            </section>

            {project.ai_plan && (
              <section className="space-y-8">
                <div className="flex items-center gap-2 border-b border-forest-100 pb-4">
                  <Sparkles className="w-6 h-6 text-forest-600" />
                  <h2 className="text-2xl font-bold text-earth-900">Eco-Garden Intelligence Plan</h2>
                </div>
                <div className="prose prose-earth max-w-none whitespace-pre-wrap text-earth-700 leading-relaxed bg-forest-50/30 p-8 rounded-3xl border border-forest-100">
                  {project.ai_plan}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-earth-100 p-6 rounded-2xl border border-earth-200">
              <h3 className="font-bold mb-4">Membership</h3>
              {project.isMember ? (
                <div className="text-forest-600 font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-forest-600" />
                  Active Member
                </div>
              ) : requested ? (
                <div className="text-amber-600 font-bold">Request Pending</div>
              ) : (
                <button 
                  onClick={handleJoin}
                  className="w-full bg-forest-600 text-white py-3 rounded-xl font-bold hover:bg-forest-500 transition-colors"
                >
                  Request to Join
                </button>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-earth-200 space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-earth-400">Site Data</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-earth-400 uppercase">Soil Type</p>
                  <p className="text-sm font-medium">{project.soil_type || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-earth-400 uppercase">Outcome</p>
                  <p className="text-sm font-medium">{project.outcome || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-earth-400 uppercase">Commitment</p>
                  <p className="text-sm font-medium">{project.time_commitment || 'Not specified'} hrs/week</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-earth-500 text-center">
              Coordinates: {project.lat.toFixed(4)}, {project.lng.toFixed(4)}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPlanner && (
          <ProjectPlanner 
            project={project} 
            onClose={() => setShowPlanner(false)} 
            onSave={handleSaveMap} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const Dashboard = ({ user }: { user: User }) => {
  const [data, setData] = useState<{ myProjects: Project[], pendingRequests: JoinRequest[] } | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard/${user.id}`).then(res => res.json()).then(setData);
  }, [user]);

  const handleRespond = async (requestId: number, status: 'approved' | 'rejected') => {
    await fetch(`/api/requests/${requestId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    // Refresh
    fetch(`/api/dashboard/${user.id}`).then(res => res.json()).then(setData);
  };

  const seedTestProject = async () => {
    const id = 'test-garden-' + Math.random().toString(36).substring(7);
    const lat = 39.0997 + (Math.random() - 0.5) * 0.2;
    const lng = -94.5786 + (Math.random() - 0.5) * 0.2;
    
    const testProject = {
      id,
      owner_id: user.id,
      name: "Community Victory Garden",
      description: "A test project to demonstrate local coordination and sustainable gardening.",
      goals: "Grow 500lbs of produce for the local food bank.",
      lat,
      lng,
      is_public: true,
      soil_type: "Loamy",
      resources: "Basic tools, 2 rain barrels, compost bin",
      outcome: "Starting a community garden",
      time_commitment: "10",
      ai_plan: "Phase 1: Soil testing and bed preparation...\nPhase 2: Planting cool-season crops...",
      sub_goals: ["Adding Tomatoes", "Building Raised Beds"]
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testProject)
      });
      
      if (res.ok) {
        // Refresh
        const dashRes = await fetch(`/api/dashboard/${user.id}`);
        const dashData = await dashRes.json();
        setData(dashData);
        alert("Test project created successfully!");
      } else {
        alert("Failed to create test project.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while seeding the project.");
    }
  };

  if (!data) return <div className="ml-64 p-12">Loading...</div>;

  return (
    <div className="ml-64 mr-80 p-12 space-y-12">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome, {user.id}</h1>
          <p className="text-earth-600">Manage your local coordination efforts.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={seedTestProject}
            className="bg-earth-100 text-earth-600 px-6 py-3 rounded-2xl font-bold hover:bg-earth-200 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Seed Test Project
          </button>
          <Link 
            to="/create" 
            className="bg-forest-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-forest-500 transition-all shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Project
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-8">
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-forest-600" />
            My Projects
          </h2>
          <div className="space-y-4">
            {data.myProjects.map(p => (
              <Link key={p.id} to={`/project/${p.id}`} className="block bg-white p-6 rounded-2xl border border-earth-200 hover:border-forest-400 transition-all shadow-sm">
                <h3 className="font-bold text-lg">{p.name}</h3>
                <p className="text-sm text-earth-600 line-clamp-1">{p.description}</p>
              </Link>
            ))}
            {data.myProjects.length === 0 && <p className="text-earth-400 italic">No projects created yet.</p>}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-forest-600" />
            Join Requests
          </h2>
          <div className="space-y-4">
            {data.pendingRequests.map(r => (
              <div key={r.id} className="bg-white p-6 rounded-2xl border border-earth-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-bold">{r.requester_id}</p>
                    <p className="text-xs text-earth-500">wants to join <span className="font-bold">{r.project_name}</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleRespond(r.id, 'approved')}
                    className="flex-1 bg-forest-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-forest-500"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleRespond(r.id, 'rejected')}
                    className="flex-1 bg-earth-100 text-earth-600 py-2 rounded-lg text-sm font-bold hover:bg-earth-200"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
            {data.pendingRequests.length === 0 && <p className="text-earth-400 italic">No pending requests.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

const SUB_GOAL_OPTIONS = [
  'Adding Tomatoes',
  'Adding Peppers',
  'Adding Herbs',
  'Installing Irrigation',
  'Building Raised Beds',
  'Composting Setup',
  'Pollinator Garden Section',
  'Fruit Trees',
  'Native Plants'
];

const CreateProject = ({ user }: { user: User }) => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    goals: '',
    is_public: true,
    soil_type: 'Loamy',
    resources: '',
    outcome: 'Starting a community garden',
    time_commitment: '5',
    ai_plan: '',
    sub_goals: [] as string[]
  });

  const toggleSubGoal = (goal: string) => {
    setForm(prev => ({
      ...prev,
      sub_goals: prev.sub_goals.includes(goal)
        ? prev.sub_goals.filter(g => g !== goal)
        : [...prev.sub_goals, goal]
    }));
  };

  const generateAIPlan = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const prompt = `
        You are the "Eco-Garden Intelligence Engine." Your goal is to help users design hyper-local gardening projects.
        
        Input Context:
        - Location: Zip Code ${user.zipcode || 'Unknown'}, USDA Planting Zone ${user.land_zone || 'Unknown'}.
        - Project Status: Create New
        - Site Data: Soil type ${form.soil_type}, Resources: ${form.resources || 'Basic tools'}.
        - User Intent: 
          * Main Goal: ${form.outcome}
          * Sub-Goals: ${form.sub_goals.join(', ') || 'None specified'}
          * Manual Goals: ${form.goals || 'None'}
          * Time Commitment: ${form.time_commitment} hours/week.
        
        Data Integration Requirements:
        - Weather & Climate: Current seasonal outlook for Zip Code ${user.zipcode || 'Unknown'}.
        - Toxicity & Air Safety: Assess "Down Drift" potential. Issue a "Drift Danger Rating" (Low/Med/High).
        - Regional Pest Intelligence: Common pests in ${user.zipcode || 'Unknown'} and natural deterrents.
        - Companion Planting & Pollinators: Use a "Guild" approach.
        
        Output Format:
        1. Project Summary: A catchy name and mission statement.
        2. Risk Assessment: Air quality and pesticide drift.
        3. The "Planting Matrix": A table showing [Primary Plant] | [Companion Plant] | [Pest/Pollinator Benefit].
        4. Phased Action Plan: Week-by-week for the first month.
        5. Resource Gap Analysis: What they have vs. what they need.
        
        Tone: Professional, ecologically conscious, encouraging, and safety-oriented.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setForm(prev => ({ ...prev, ai_plan: response.text || '' }));
    } catch (error) {
      console.error("AI Generation failed:", error);
      alert("AI generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = Math.random().toString(36).substring(7);
    // Kansas City area (roughly center of KS/MO)
    const lat = 39.0997 + (Math.random() - 0.5) * 0.2;
    const lng = -94.5786 + (Math.random() - 0.5) * 0.2;

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id, owner_id: user.id, lat, lng })
      });
      
      if (res.ok) {
        navigate(`/project/${id}`);
      } else {
        const data = await res.json();
        alert(`Failed to create project: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Project creation failed:", error);
      alert("Failed to create project. Please check your connection.");
    }
  };

  return (
    <div className="ml-64 mr-80 p-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Start New Project</h1>
      <div className="grid grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="col-span-2 space-y-6 bg-white p-8 rounded-3xl border border-earth-200 shadow-lg">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-earth-600 mb-2">Project Name</label>
              <input 
                required
                className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-earth-600 mb-2">Outcome Goal</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
                value={form.outcome}
                onChange={e => setForm({ ...form, outcome: e.target.value })}
              >
                <option>Starting a community garden</option>
                <option>Rescuing a community garden</option>
                <option>Expending a personal garden project</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-earth-600 mb-2">Sub-Goals (Select all that apply)</label>
            <div className="grid grid-cols-2 gap-2 bg-earth-50 p-4 rounded-xl border border-earth-100">
              {SUB_GOAL_OPTIONS.map(goal => (
                <label key={goal} className="flex items-center gap-2 text-sm cursor-pointer hover:text-forest-700">
                  <input 
                    type="checkbox"
                    checked={form.sub_goals.includes(goal)}
                    onChange={() => toggleSubGoal(goal)}
                    className="w-4 h-4 accent-forest-600"
                  />
                  {goal}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-earth-600 mb-2">Description</label>
            <textarea 
              required
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-earth-600 mb-2">Soil Type</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
                value={form.soil_type}
                onChange={e => setForm({ ...form, soil_type: e.target.value })}
              >
                <option>Clay</option>
                <option>Sandy</option>
                <option>Loamy</option>
                <option>Silty</option>
                <option>Peaty</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-earth-600 mb-2">Time (hrs/week)</label>
              <input 
                type="number"
                className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
                value={form.time_commitment}
                onChange={e => setForm({ ...form, time_commitment: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-earth-600 mb-2">Resources Available</label>
            <input 
              placeholder="e.g. basic tools, hose access, $200 budget"
              className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
              value={form.resources}
              onChange={e => setForm({ ...form, resources: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-earth-600 mb-2">Manual Goals (Optional)</label>
            <textarea 
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
              value={form.goals}
              onChange={e => setForm({ ...form, goals: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="checkbox"
              id="is_public"
              checked={form.is_public}
              onChange={e => setForm({ ...form, is_public: e.target.checked })}
              className="w-5 h-5 accent-forest-600"
            />
            <label htmlFor="is_public" className="text-sm font-bold text-earth-700">Make this project public</label>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button"
              onClick={generateAIPlan}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-2 bg-forest-100 text-forest-700 py-4 rounded-xl font-bold hover:bg-forest-200 transition-all disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Generate AI Plan
            </button>
            <button className="flex-1 bg-forest-600 text-white py-4 rounded-xl font-bold hover:bg-forest-500 transition-all shadow-lg">
              Create Project
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="bg-forest-900 text-white p-6 rounded-3xl shadow-lg border border-forest-800">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-forest-300" />
              AI Preview
            </h3>
            {form.ai_plan ? (
              <div className="text-xs opacity-80 line-clamp-[15] whitespace-pre-wrap">
                {form.ai_plan}
              </div>
            ) : (
              <p className="text-xs opacity-50 italic">Fill out the form and click "Generate AI Plan" to see your personalized garden strategy.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EditProject = ({ user }: { user: User }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    goals: '',
    is_public: true,
    soil_type: '',
    resources: '',
    outcome: '',
    time_commitment: '',
    ai_plan: '',
    sub_goals: [] as string[]
  });

  const toggleSubGoal = (goal: string) => {
    setForm(prev => ({
      ...prev,
      sub_goals: prev.sub_goals.includes(goal)
        ? prev.sub_goals.filter(g => g !== goal)
        : [...prev.sub_goals, goal]
    }));
  };

  useEffect(() => {
    fetch(`/api/projects/${id}?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setForm({
          name: data.name,
          description: data.description,
          goals: data.goals,
          is_public: data.is_public === 1 || data.is_public === true,
          soil_type: data.soil_type || 'Loamy',
          resources: data.resources || '',
          outcome: data.outcome || 'Starting a community garden',
          time_commitment: data.time_commitment || '5',
          ai_plan: data.ai_plan || '',
          sub_goals: data.sub_goals || []
        });
        setLoading(false);
      });
  }, [id, user.id]);

  const generateAIPlan = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const prompt = `
        You are the "Eco-Garden Intelligence Engine." Your goal is to help users design hyper-local gardening projects.
        
        Input Context:
        - Location: Zip Code ${user.zipcode || 'Unknown'}, USDA Planting Zone ${user.land_zone || 'Unknown'}.
        - Project Status: Update Existing
        - Site Data: Soil type ${form.soil_type}, Resources: ${form.resources || 'Basic tools'}.
        - User Intent: 
          * Main Goal: ${form.outcome}
          * Sub-Goals: ${form.sub_goals.join(', ') || 'None specified'}
          * Manual Goals: ${form.goals || 'None'}
          * Time Commitment: ${form.time_commitment} hours/week.
        
        Data Integration Requirements:
        - Weather & Climate: Current seasonal outlook for Zip Code ${user.zipcode || 'Unknown'}.
        - Toxicity & Air Safety: Assess "Down Drift" potential. Issue a "Drift Danger Rating" (Low/Med/High).
        - Regional Pest Intelligence: Common pests in ${user.zipcode || 'Unknown'} and natural deterrents.
        - Companion Planting & Pollinators: Use a "Guild" approach.
        
        Output Format:
        1. Project Summary: A catchy name and mission statement.
        2. Risk Assessment: Air quality and pesticide drift.
        3. The "Planting Matrix": A table showing [Primary Plant] | [Companion Plant] | [Pest/Pollinator Benefit].
        4. Phased Action Plan: Week-by-week for the first month.
        5. Resource Gap Analysis: What they have vs. what they need.
        
        Tone: Professional, ecologically conscious, encouraging, and safety-oriented.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setForm(prev => ({ ...prev, ai_plan: response.text || '' }));
    } catch (error) {
      console.error("AI Generation failed:", error);
      alert("AI generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, userId: user.id })
    });
    if (res.ok) {
      navigate(`/project/${id}`);
    } else {
      alert('Failed to update project');
    }
  };

  if (loading) return <div className="ml-64 p-12">Loading...</div>;

  return (
    <div className="ml-64 mr-80 p-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Edit Project</h1>
      <div className="grid grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="col-span-2 space-y-6 bg-white p-8 rounded-3xl border border-earth-200 shadow-lg">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-earth-600 mb-2">Project Name</label>
              <input 
                required
                className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-earth-600 mb-2">Outcome Goal</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
                value={form.outcome}
                onChange={e => setForm({ ...form, outcome: e.target.value })}
              >
                <option>Starting a community garden</option>
                <option>Rescuing a community garden</option>
                <option>Expending a personal garden project</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-earth-600 mb-2">Sub-Goals (Select all that apply)</label>
            <div className="grid grid-cols-2 gap-2 bg-earth-50 p-4 rounded-xl border border-earth-100">
              {SUB_GOAL_OPTIONS.map(goal => (
                <label key={goal} className="flex items-center gap-2 text-sm cursor-pointer hover:text-forest-700">
                  <input 
                    type="checkbox"
                    checked={form.sub_goals.includes(goal)}
                    onChange={() => toggleSubGoal(goal)}
                    className="w-4 h-4 accent-forest-600"
                  />
                  {goal}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-earth-600 mb-2">Description</label>
            <textarea 
              required
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-earth-600 mb-2">Soil Type</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
                value={form.soil_type}
                onChange={e => setForm({ ...form, soil_type: e.target.value })}
              >
                <option>Clay</option>
                <option>Sandy</option>
                <option>Loamy</option>
                <option>Silty</option>
                <option>Peaty</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-earth-600 mb-2">Time (hrs/week)</label>
              <input 
                type="number"
                className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
                value={form.time_commitment}
                onChange={e => setForm({ ...form, time_commitment: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-earth-600 mb-2">Resources Available</label>
            <input 
              placeholder="e.g. basic tools, hose access, $200 budget"
              className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
              value={form.resources}
              onChange={e => setForm({ ...form, resources: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-earth-600 mb-2">Manual Goals (Optional)</label>
            <textarea 
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
              value={form.goals}
              onChange={e => setForm({ ...form, goals: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="checkbox"
              id="is_public"
              checked={form.is_public}
              onChange={e => setForm({ ...form, is_public: e.target.checked })}
              className="w-5 h-5 accent-forest-600"
            />
            <label htmlFor="is_public" className="text-sm font-bold text-earth-700">Make this project public</label>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button"
              onClick={() => navigate(`/project/${id}`)}
              className="flex-1 bg-earth-100 text-earth-600 py-4 rounded-xl font-bold hover:bg-earth-200 transition-all"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={generateAIPlan}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-2 bg-forest-100 text-forest-700 py-4 rounded-xl font-bold hover:bg-forest-200 transition-all disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Regenerate AI Plan
            </button>
            <button className="flex-1 bg-forest-600 text-white py-4 rounded-xl font-bold hover:bg-forest-500 transition-all shadow-lg">
              Save Changes
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="bg-forest-900 text-white p-6 rounded-3xl shadow-lg border border-forest-800">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-forest-300" />
              AI Plan Preview
            </h3>
            {form.ai_plan ? (
              <div className="text-xs opacity-80 line-clamp-[25] whitespace-pre-wrap overflow-y-auto max-h-[500px]">
                {form.ai_plan}
              </div>
            ) : (
              <p className="text-xs opacity-50 italic">Click "Regenerate AI Plan" to update your garden strategy.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const INTEREST_OPTIONS = ["Community Gardens", "Urban Farms", "Native Plants"];

const Profile = ({ user, onUpdate }: { user: User, onUpdate: (u: User) => void }) => {
  const [form, setForm] = useState({ ...user, newPin: '' });
  const [isFetchingZone, setIsFetchingZone] = useState(false);
  const [showOther, setShowOther] = useState(() => {
    return form.interests && !INTEREST_OPTIONS.includes(form.interests);
  });
  const [selectedInterest, setSelectedInterest] = useState(() => {
    if (!form.interests) return INTEREST_OPTIONS[0];
    if (INTEREST_OPTIONS.includes(form.interests)) return form.interests;
    return "Other";
  });

  const handleInterestChange = (val: string) => {
    setSelectedInterest(val);
    if (val === "Other") {
      setShowOther(true);
      // Keep existing value if it was already "Other", otherwise clear for new input
      if (INTEREST_OPTIONS.includes(form.interests || '')) {
        setForm(prev => ({ ...prev, interests: '' }));
      }
    } else {
      setShowOther(false);
      setForm(prev => ({ ...prev, interests: val }));
    }
  };

  const fetchHardinessZone = async () => {
    if (!form.zipcode || form.zipcode.length !== 5) {
      alert('Please enter a valid 5-digit zipcode first.');
      return;
    }

    setIsFetchingZone(true);
    try {
      // Using phzmapi.org - a common public API for hardiness zones
      const response = await fetch(`https://phzmapi.org/${form.zipcode}.json`);
      if (!response.ok) throw new Error('Zone data not found for this zipcode.');
      const data = await response.json();
      if (data.zone) {
        setForm(prev => ({ ...prev, land_zone: data.zone }));
      }
    } catch (error) {
      console.error('Failed to fetch hardiness zone:', error);
      alert('Could not automatically determine zone. Please enter it manually.');
    } finally {
      setIsFetchingZone(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      zipcode: form.zipcode,
      state: form.state,
      land_zone: form.land_zone,
      interests: form.interests,
      pin: form.newPin || undefined
    };

    await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const updatedUser = { ...user, ...payload };
    if (payload.pin) updatedUser.pin = payload.pin;
    delete (updatedUser as any).newPin;
    
    onUpdate(updatedUser);
    setForm(prev => ({ ...prev, newPin: '' }));
    alert('Profile updated!');
  };

  return (
    <div className="ml-64 mr-80 p-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-3xl border border-earth-200 shadow-lg">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-earth-600 mb-2">User ID</label>
            <input 
              disabled
              className="w-full px-4 py-3 rounded-xl border border-earth-200 bg-earth-50 text-earth-400 outline-none cursor-not-allowed"
              value={user.id}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-earth-600 mb-2">Reset PIN (Optional)</label>
            <input 
              type="password"
              maxLength={4}
              placeholder="New 4-char PIN"
              className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
              value={form.newPin}
              onChange={e => setForm({ ...form, newPin: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-earth-600 mb-2">Zipcode</label>
            <input 
              className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
              value={form.zipcode || ''}
              onChange={e => setForm({ ...form, zipcode: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-earth-600 mb-2">State</label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
              value={form.state || ''}
              onChange={e => setForm({ ...form, state: e.target.value })}
            >
              <option value="">Select State</option>
              {US_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-earth-600 mb-2">USDA Hardiness Zone</label>
          <div className="flex gap-2">
            <input 
              placeholder="e.g. 7b"
              className="flex-1 px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
              value={form.land_zone || ''}
              onChange={e => setForm({ ...form, land_zone: e.target.value })}
            />
            <button 
              type="button"
              onClick={fetchHardinessZone}
              disabled={isFetchingZone}
              className="px-4 bg-forest-100 text-forest-700 rounded-xl font-bold hover:bg-forest-200 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isFetchingZone ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Auto-Fetch
            </button>
          </div>
          <p className="text-[10px] text-earth-400 mt-1">Determines what plants thrive in your climate.</p>
        </div>
        <div>
          <label className="block text-sm font-bold text-earth-600 mb-2">Interests</label>
          <div className="space-y-3">
            <select 
              className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
              value={selectedInterest}
              onChange={e => handleInterestChange(e.target.value)}
            >
              {INTEREST_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
              <option value="Other">Other</option>
            </select>
            
            {showOther && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <input 
                  placeholder="Type your interest..."
                  className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
                  value={form.interests || ''}
                  onChange={e => setForm({ ...form, interests: e.target.value })}
                />
              </motion.div>
            )}
          </div>
        </div>
        <button className="w-full bg-forest-600 text-white py-4 rounded-xl font-bold hover:bg-forest-500 transition-all shadow-lg">
          Save Changes
        </button>
      </form>
    </div>
  );
};

const AuthPage = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [userId, setUserId] = useState('');
  const [pin, setPin] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, pin })
    });
    const data = await res.json();
    if (data.success) {
      if (isLogin) {
        onLogin(data.user);
        navigate('/');
      } else {
        setIsLogin(true);
        alert('Registered! Please login.');
      }
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="ml-64 mr-80 h-screen flex items-center justify-center p-12">
      <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl border border-earth-200">
        <h2 className="text-3xl font-bold mb-8 text-center">{isLogin ? 'Welcome Back' : 'Join the Community'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-earth-600 mb-2">User ID</label>
            <input 
              required
              className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none"
              value={userId}
              onChange={e => setUserId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-earth-600 mb-2">PIN (4 characters)</label>
            <input 
              required
              type="password"
              maxLength={4}
              className="w-full px-4 py-3 rounded-xl border border-earth-200 focus:ring-2 focus:ring-forest-500 outline-none text-center tracking-[1em] text-2xl font-bold"
              value={pin}
              onChange={e => setPin(e.target.value)}
            />
          </div>
          <button className="w-full bg-forest-600 text-white py-4 rounded-xl font-bold hover:bg-forest-500 transition-all shadow-lg">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-6 text-sm text-earth-500 hover:text-forest-600 font-medium"
        >
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <div className="min-h-screen">
        <Sidebar user={user} onLogout={handleLogout} />
        <InfoFeed user={user} />
        
        <main>
          <Routes>
            <Route path="/" element={<LandingPage user={user} />} />
            <Route path="/login" element={<AuthPage onLogin={handleLogin} />} />
            <Route path="/project/:id" element={<ProjectProfile user={user} />} />
            {user && (
              <>
                <Route path="/project/:id/edit" element={<EditProject user={user} />} />
                <Route path="/dashboard" element={<Dashboard user={user} />} />
                <Route path="/profile" element={<Profile user={user} onUpdate={setUser} />} />
                <Route path="/create" element={<CreateProject user={user} />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}
