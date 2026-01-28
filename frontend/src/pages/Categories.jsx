import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "@/utils/api";
import { getImageUrl, getSrcSet, onImageError } from '@/utils/imageHelper';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function Categories({ user, setUser }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    apiClient
      .get("/categories")
      .then((res) => {
        if (!mounted) return;
        const categoriesData = res.data || [];
        // Filter to show only: Shirts, Jeans, Ladies Dresses, Sarees
        // Replace "Men's Wear" or "mens-wear" with "Jeans"
        const allowedCategories = ['shirts', 'jeans', 'ladies-dresses', 'sarees', 'kids-wear'];
        const filteredCategories = categoriesData
          .map(cat => {
            // Replace Men's Wear with Jeans
            if (cat.slug === 'mens-wear' || cat.name === "Men's Wear") {
              return { ...cat, name: 'Jeans', slug: 'jeans' };
            }
            return cat;
          })
          .filter(cat => allowedCategories.includes(cat.slug));
        setCategories(filteredCategories);
      })
      .catch(() => {
        if (!mounted) return;
        // Fallback categories - only show the 4 allowed ones
        setCategories([
          { name: "Shirts", slug: "shirts", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400" },
          { name: "Jeans", slug: "jeans", image: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=400" },
          { name: "Ladies Dresses", slug: "ladies-dresses", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400" },
          { name: "Sarees", slug: "sarees", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400" },
          { name: "Kids Wear", slug: "kids-wear", image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=400" },
        ]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const [expandedCategory, setExpandedCategory] = useState(null);

  const GridItem = ({ item }) => {
    const isKidsWear = item.slug === 'kids-wear';
    const isExpanded = expandedCategory === item.slug;

    const Wrapper = ({ children }) => {
      if (isKidsWear) {
        return (
          <div 
            className="block group cursor-pointer"
            onClick={() => setExpandedCategory(isExpanded ? null : item.slug)}
          >
            {children}
          </div>
        );
      }
      return (
        <Link 
          to={`/products?category=${item.slug}`} 
          className="block group"
        >
          {children}
        </Link>
      );
    };

    return (
      <Wrapper>
        <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 h-full ${isExpanded ? 'ring-2 ring-purple-500' : ''}`}>
          <CardContent className="p-3 sm:p-5 h-full">
            <div className="flex flex-col items-center gap-3 text-center h-full">
              <div className={`relative w-full aspect-square rounded-lg bg-gray-100 overflow-hidden shrink-0 transition-all duration-300 ${isExpanded ? 'h-32' : ''}`}>
                <img
                  src={getImageUrl(item.image)}
                  srcSet={getSrcSet(item.image)}
                  sizes="(max-width: 768px) 50vw, 33vw"
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={onImageError}
                />
              </div>
              <div className="min-w-0 flex flex-col justify-center flex-1 w-full">
                <div className="text-sm sm:text-lg font-semibold text-gray-900 truncate w-full">
                  {item.name}
                </div>
                
                {isExpanded ? (
                  <div 
                    className="flex flex-col gap-2 mt-2 w-full animate-in fade-in zoom-in duration-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link to="/products?category=kids-wear&subcategory=Boys" className="block w-full">
                      <Button variant="outline" size="sm" className="w-full hover:bg-purple-50 hover:text-purple-600">Boys</Button>
                    </Link>
                    <Link to="/products?category=kids-wear&subcategory=Girls" className="block w-full">
                      <Button variant="outline" size="sm" className="w-full hover:bg-purple-50 hover:text-purple-600">Girls</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm text-gray-500 mt-1 group-hover:text-purple-600 transition-colors">
                    {isKidsWear ? 'Click to View' : 'Explore'}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Wrapper>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            <span className="gradient-text">Shop by Category</span>
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3 sm:p-5">
                  <div className="flex flex-col items-center gap-3">
                    <Skeleton className="w-full aspect-square rounded-lg" />
                    <div className="w-full space-y-2 flex flex-col items-center">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {categories.map((cat) => (
              <GridItem key={cat.slug} item={cat} />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
