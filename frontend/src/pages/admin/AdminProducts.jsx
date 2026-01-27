import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminClient } from '@/utils/api';
import { getImageUrl, onImageError, isPdf, getFileUrl } from '@/utils/imageHelper';
import { toast } from 'sonner';
import axios from 'axios';
import { API } from '@/utils/api';
import Loading from '@/components/Loading';

export default function AdminProducts({ admin, setAdmin }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All', 'Sarees', 'T-Shirts', 'Shirts', 'Hoodies', 'Jewelry', 'Kids Wear', 'Ladies Dresses', 'Men\'s Wear', 'Jeans']);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    brand: '',
    price: '',
    mrp: '',
    stock: '',
    images: '',
    sizes: '',
    colors: '',
    sku: '',
    tags: '',
    product_details: [],
    is_featured: false,
    returnable: false,
    color_images_map: {},
    color_details_map: {},
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedColorForImages, setSelectedColorForImages] = useState('');
  const [selectedColorForDetails, setSelectedColorForDetails] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products?limit=100`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title,
        description: product.description,
        category: product.category,
        brand: product.brand || '',
        price: product.price.toString(),
        mrp: product.mrp.toString(),
        stock: product.stock.toString(),
        images: product.images.join(', '),
        sizes: product.sizes.join(', '),
        colors: product.colors.join(', '),
        sku: product.sku || '',
        tags: product.tags.join(', '),
        product_details: product.product_details 
          ? Object.entries(product.product_details).map(([key, value]) => ({ key, value }))
          : [],
        is_featured: product.is_featured,
        returnable: product.returnable || false,
        color_images_map: product.color_images || {},
        color_details_map: product.color_details 
          ? Object.fromEntries(Object.entries(product.color_details).map(([c, obj]) => [c, Object.entries(obj).map(([key, value]) => ({ key, value }))]))
          : {},
      });
      setUploadedFiles([]); // Reset uploaded files
    } else {
      setEditingProduct(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        brand: '',
        price: '',
        mrp: '',
        stock: '',
        images: '',
        sizes: '',
        colors: '',
        sku: '',
        tags: '',
        product_details: [],
        is_featured: false,
        returnable: false,
        color_images_map: {},
        color_details_map: {},
      });
      setUploadedFiles([]); // Reset uploaded files
    }
    setShowDialog(true);
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    
    try {
      const response = await axios.post(`${API}/upload-multiple`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      const newUploadedFiles = response.data.files;
      setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
      
      // Update the images field with all image paths
      const allImagePaths = [
        ...(formData.images ? formData.images.split(',').map(img => img.trim()).filter(Boolean) : []),
        ...newUploadedFiles.map(file => file.path)
      ];
      
      setFormData(prev => ({
        ...prev,
        images: allImagePaths.join(', ')
      }));
      
      toast.success(`${newUploadedFiles.length} images uploaded successfully`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    }
  };

  const handleAddDetail = () => {
    setFormData({
      ...formData,
      product_details: [...formData.product_details, { key: '', value: '' }]
    });
  };

  const handleRemoveDetail = (index) => {
    const newDetails = [...formData.product_details];
    newDetails.splice(index, 1);
    setFormData({ ...formData, product_details: newDetails });
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...formData.product_details];
    newDetails[index][field] = value;
    setFormData({ ...formData, product_details: newDetails });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      brand: formData.brand || null,
      price: parseFloat(formData.price),
      mrp: parseFloat(formData.mrp),
      stock: parseInt(formData.stock),
      images: formData.images.split(',').map((img) => img.trim()).filter(Boolean),
      sizes: formData.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: formData.colors.split(',').map((c) => c.trim()).filter(Boolean),
      sku: formData.sku || null,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      product_details: formData.product_details.reduce((acc, item) => {
        if (item.key && item.value) acc[item.key] = item.value;
        return acc;
      }, {}),
      is_featured: formData.is_featured,
      returnable: formData.returnable,
      color_images: formData.color_images_map,
      color_details: Object.fromEntries(
        Object.entries(formData.color_details_map).map(([c, arr]) => [
          c,
          arr.reduce((acc, item) => {
            if (item.key && item.value) acc[item.key] = item.value;
            return acc;
          }, {})
        ])
      ),
    };

    // Set the first image as the main image if available
    if (productData.images.length > 0) {
      productData.image = productData.images[0];
    }

    try {
      if (editingProduct) {
        await adminClient.put(`/products/${editingProduct.id}`, productData);
        toast.success('Product updated successfully');
      } else {
        await adminClient.post('/products', productData);
        toast.success('Product created successfully');
      }
      setShowDialog(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await adminClient.delete(`/products/${productId}`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  if (loading) {
    return <Loading />;
  }

  const filteredProducts = products.filter(product => selectedCategory === 'All' || product.category === selectedCategory);

  return (
    <AdminLayout admin={admin} setAdmin={setAdmin} title="Product Management">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900">Products ({products.length})</h2>
            <p className="text-gray-500 mt-1">Manage your store inventory and catalog</p>
          </div>
          <Button 
            onClick={() => handleOpenDialog()} 
            className="w-full md:w-auto rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all duration-300 shadow-lg px-6 h-12 text-base font-bold" 
            data-testid="add-product-button"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add New Product
          </Button>
        </div>

        {/* Category Filter */}
        <div className="pb-4">
          <div className="w-[200px]">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full rounded-xl border-gray-200 bg-white shadow-sm hover:border-purple-300 focus:ring-purple-500 transition-all duration-300">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-100 shadow-lg">
                {categories.map((category) => (
                  <SelectItem 
                    key={category} 
                    value={category}
                    className="cursor-pointer hover:bg-purple-50 hover:text-purple-600 focus:bg-purple-50 focus:text-purple-600 rounded-lg my-1"
                  >
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No products found</h3>
            <p className="text-gray-500 mt-1 mb-6">No products are added in this category</p>
            <Button 
              onClick={() => {
                setFormData(prev => ({ ...prev, category: selectedCategory === 'All' ? '' : selectedCategory }));
                handleOpenDialog();
              }}
              className="rounded-full bg-black text-white hover:bg-gray-800"
            >
              Add Product to {selectedCategory === 'All' ? 'Catalog' : selectedCategory}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" data-testid="admin-products-grid">
            {filteredProducts.map((product) => (
            <Card key={product.id} className="group overflow-hidden rounded-2xl border-0 shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1 bg-white" data-testid={`admin-product-${product.id}`}>
              <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
                <img
                  src={getImageUrl(product.images[0])}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={onImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Overlay Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2">
                  <Button
                    onClick={() => handleOpenDialog(product)}
                    className="flex-1 bg-white text-black hover:bg-gray-100 rounded-lg font-bold shadow-lg h-8 text-xs"
                    size="sm"
                    data-testid={`edit-product-${product.id}`}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(product.id)}
                    variant="destructive"
                    size="icon"
                    className="w-8 h-8 rounded-lg shadow-lg"
                    data-testid={`delete-product-${product.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-1.5">
                  <div className="bg-gray-100 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-gray-600">
                    {product.category}
                  </div>
                  {product.stock < 5 && (
                    <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                      Low: {product.stock}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm mb-1 line-clamp-1 group-hover:text-purple-600 transition-colors" title={product.title}>{product.title}</h3>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <p className="text-[10px] text-gray-500 font-medium">Price</p>
                    <span className="text-base font-black tracking-tight">₹{product.price.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] text-gray-500 font-medium">Stock</p>
                     <span className="text-xs font-bold text-gray-900">{product.stock}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </div>

      {/* Product Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="product-form-title">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Product Title*</Label>
              <Input
                id="title"
                data-testid="product-title-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description*</Label>
              <Textarea
                id="description"
                data-testid="product-description-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category*</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger id="category" data-testid="product-category-input">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(cat => cat !== 'All').map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  data-testid="product-brand-input"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price (₹)*</Label>
                <Input
                  id="price"
                  data-testid="product-price-input"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="mrp">MRP (₹)*</Label>
                <Input
                  id="mrp"
                  data-testid="product-mrp-input"
                  type="number"
                  step="0.01"
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock*</Label>
                <Input
                  id="stock"
                  data-testid="product-stock-input"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="images">Product Images</Label>
              <div className="flex flex-col space-y-2">
                <Input
                  id="images"
                  data-testid="product-images-input"
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="flex-1"
                    data-testid="product-image-upload"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('images').focus()}>
                    Upload Images
                  </Button>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Uploaded images:</p>
                    <div className="flex flex-wrap gap-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden">
                          {isPdf(file.path) ? (
                            <object data={getFileUrl(file.path)} type="application/pdf" className="w-full h-full">
                              <a href={getFileUrl(file.path)} target="_blank" rel="noreferrer">Open PDF</a>
                            </object>
                          ) : (
                            <img src={getImageUrl(file.path)} alt={`Uploaded ${index + 1}`} className="w-full h-full object-cover" onError={onImageError} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  <Label className="font-bold text-gray-700">Assign Images to Color</Label>
                  <div className="flex items-center gap-2">
                    <Select value={selectedColorForImages} onValueChange={(value) => setSelectedColorForImages(value)}>
                      <SelectTrigger className="w-52 rounded-xl border-gray-200 focus:ring-purple-200">
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {(formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(Boolean) : []).map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        if (!selectedColorForImages) {
                          toast.error('Select a color first');
                          return;
                        }
                        const newPaths = uploadedFiles.map(f => f.path);
                        setFormData(prev => ({
                          ...prev,
                          color_images_map: {
                            ...prev.color_images_map,
                            [selectedColorForImages]: [
                              ...(prev.color_images_map[selectedColorForImages] || []),
                              ...newPaths
                            ]
                          }
                        }));
                        toast.success('Assigned uploaded images to color');
                      }}
                    >
                      Assign uploaded images
                    </Button>
                  </div>
                  {selectedColorForImages && (
                    <div className="mt-3">
                      <Label className="text-xs text-gray-500 uppercase tracking-wider font-bold">Images for {selectedColorForImages}</Label>
                      <Input
                        value={(formData.color_images_map[selectedColorForImages] || []).join(', ')}
                        onChange={(e) => {
                          const paths = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          setFormData(prev => ({
                            ...prev,
                            color_images_map: { ...prev.color_images_map, [selectedColorForImages]: paths }
                          }));
                        }}
                        placeholder="/uploads/color-img1.jpg, /uploads/color-img2.jpg"
                        className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-200 mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sizes" className="font-bold text-gray-700">Sizes (comma-separated)</Label>
                <Input
                  id="sizes"
                  data-testid="product-sizes-input"
                  value={formData.sizes}
                  onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                  placeholder="S, M, L, XL"
                  className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-200"
                />
              </div>
              <div>
                <Label htmlFor="colors" className="font-bold text-gray-700">Colors (comma-separated)</Label>
                <Input
                  id="colors"
                  data-testid="product-colors-input"
                  value={formData.colors}
                  onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                  placeholder="Red, Blue, Black"
                  className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">Color-Specific Details</Label>
              <div className="flex items-center gap-2 mb-2">
                <Select value={selectedColorForDetails} onValueChange={(value) => setSelectedColorForDetails(value)}>
                  <SelectTrigger className="w-52 rounded-xl border-gray-200 focus:ring-purple-200">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {(formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(Boolean) : []).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedColorForDetails && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        color_details_map: {
                          ...prev.color_details_map,
                          [selectedColorForDetails]: [
                            ...(prev.color_details_map[selectedColorForDetails] || []),
                            { key: '', value: '' }
                          ]
                        }
                      }));
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Detail
                  </Button>
                )}
              </div>
              {selectedColorForDetails && (formData.color_details_map[selectedColorForDetails] || []).map((detail, index) => (
                <div key={`${selectedColorForDetails}-${index}`} className="flex gap-2 items-center">
                  <Input
                    placeholder="Key (e.g. Border Color)"
                    value={detail.key}
                    onChange={(e) => {
                      const arr = [...(formData.color_details_map[selectedColorForDetails] || [])];
                      arr[index] = { ...arr[index], key: e.target.value };
                      setFormData(prev => ({
                        ...prev,
                        color_details_map: { ...prev.color_details_map, [selectedColorForDetails]: arr }
                      }));
                    }}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value (e.g. Gold)"
                    value={detail.value}
                    onChange={(e) => {
                      const arr = [...(formData.color_details_map[selectedColorForDetails] || [])];
                      arr[index] = { ...arr[index], value: e.target.value };
                      setFormData(prev => ({
                        ...prev,
                        color_details_map: { ...prev.color_details_map, [selectedColorForDetails]: arr }
                      }));
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      const arr = [...(formData.color_details_map[selectedColorForDetails] || [])];
                      arr.splice(index, 1);
                      setFormData(prev => ({
                        ...prev,
                        color_details_map: { ...prev.color_details_map, [selectedColorForDetails]: arr }
                      }));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  data-testid="product-sku-input"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  data-testid="product-tags-input"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="trending, new, sale"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Product Details (Key-Value Pairs)</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddDetail}>
                  <Plus className="h-4 w-4 mr-1" /> Add Detail
                </Button>
              </div>
              {formData.product_details.map((detail, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Key (e.g. Brand)"
                    value={detail.key}
                    onChange={(e) => handleDetailChange(index, 'key', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value (e.g. FORTUNE)"
                    value={detail.value}
                    onChange={(e) => handleDetailChange(index, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveDetail(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
               <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="is_featured">Featured Product</Label>
               </div>
               <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="returnable"
                  checked={formData.returnable}
                  onChange={(e) => setFormData({ ...formData, returnable: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="returnable">Returnable</Label>
               </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
