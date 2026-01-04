import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "@/utils/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
        setCategories(res.data || []);
      })
      .catch(() => {
        if (!mounted) return;
        setCategories([
          { name: "Sarees", slug: "sarees", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400" },
          { name: "T-Shirts", slug: "t-shirts", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400" },
          { name: "Shirts", slug: "shirts", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400" },
          { name: "Hoodies", slug: "hoodies", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400" },
          { name: "Jewelry", slug: "jewelry", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400" },
          { name: "Ladies Dresses", slug: "ladies-dresses", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400" },
          { name: "Kids Wear", slug: "kids-wear", image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400" },
          { name: "Men's Wear", slug: "mens-wear", image: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=400" },
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

  const GridItem = ({ item }) => (
    <Link to={`/products?category=${item.slug}`} className="block group">
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 overflow-hidden shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {item.name}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">
                Explore {item.name.toLowerCase()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <GridItem key={cat.slug} item={cat} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
