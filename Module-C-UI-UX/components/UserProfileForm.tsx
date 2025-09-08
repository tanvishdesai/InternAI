'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';

const userProfileSchema = z.object({
  educationLevel: z.enum(['12th', 'diploma', 'ug', 'pg']),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  majorField: z.string().optional(),
  preferredSectors: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  remoteOk: z.boolean().optional(),
  availabilityStart: z.string().optional(),
  durationWeeksPref: z.string().optional(),
  stipendPref: z.string().optional()
}).refine((data) => {
  // Make sure that if arrays are provided, they have at least one item
  if (data.preferredSectors && data.preferredSectors.length === 0) {
    data.preferredSectors = undefined;
  }
  if (data.preferredLocations && data.preferredLocations.length === 0) {
    data.preferredLocations = undefined;
  }
  return true;
});

type UserProfileFormData = z.infer<typeof userProfileSchema>;

interface UserProfileFormProps {
  onSubmit: (data: UserProfileFormData) => void;
  isLoading?: boolean;
}

export default function UserProfileForm({ onSubmit, isLoading = false }: UserProfileFormProps) {
  const [currentSkill, setCurrentSkill] = useState('');
  const [currentSector, setCurrentSector] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [suggestions, setSuggestions] = useState({
    skills: [] as string[],
    sectors: [] as string[],
    locations: [] as string[]
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      skills: [],
      preferredSectors: [],
      preferredLocations: [],
      remoteOk: false,
      educationLevel: undefined
    }
  });

  const skills = watch('skills') || [];
  const preferredSectors = watch('preferredSectors') || [];
  const preferredLocations = watch('preferredLocations') || [];

  // Fetch suggestions on component mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch('/api/suggestions');
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
      }
    };

    fetchSuggestions();
  }, []);

  const addSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setValue('skills', [...skills, currentSkill.trim()]);
      setCurrentSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setValue('skills', skills.filter(skill => skill !== skillToRemove));
  };

  const addSector = () => {
    if (currentSector.trim() && !preferredSectors.includes(currentSector.trim())) {
      setValue('preferredSectors', [...preferredSectors, currentSector.trim()]);
      setCurrentSector('');
    }
  };

  const removeSector = (sectorToRemove: string) => {
    setValue('preferredSectors', preferredSectors.filter(sector => sector !== sectorToRemove));
  };

  const addLocation = () => {
    if (currentLocation.trim() && !preferredLocations.includes(currentLocation.trim())) {
      setValue('preferredLocations', [...preferredLocations, currentLocation.trim()]);
      setCurrentLocation('');
    }
  };

  const removeLocation = (locationToRemove: string) => {
    setValue('preferredLocations', preferredLocations.filter(location => location !== locationToRemove));
  };

  const onFormSubmit = (data: UserProfileFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white border-slate-200 shadow-sm">
      <CardHeader className="text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">👤</span>
        </div>
        <CardTitle className="text-3xl font-bold text-slate-900">
          Create Your Profile
        </CardTitle>
        <CardDescription className="text-slate-600 text-lg">
          Fill in your information to get personalized internship recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
          {/* Education */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm">🎓</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Education</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="educationLevel" className="text-slate-700 font-medium">Education Level</Label>
                <select
                  {...register('educationLevel')}
                  className="flex h-12 w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" className="bg-white text-slate-900">Select education level</option>
                  <option value="12th" className="bg-white text-slate-900">12th Grade</option>
                  <option value="diploma" className="bg-white text-slate-900">Diploma</option>
                  <option value="ug" className="bg-white text-slate-900">Undergraduate</option>
                  <option value="pg" className="bg-white text-slate-900">Postgraduate</option>
                </select>
                {errors.educationLevel && (
                  <p className="text-sm text-red-500">{errors.educationLevel.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="majorField" className="text-slate-700 font-medium">Major Field of Study</Label>
                <Input
                  id="majorField"
                  {...register('majorField')}
                  placeholder="e.g., Computer Science, Engineering"
                  className="bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                />
                {errors.majorField && (
                  <p className="text-sm text-red-500">{errors.majorField.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Skills</h3>
            </div>
            <div className="space-y-4">
              <AutocompleteInput
                value={currentSkill}
                onChange={setCurrentSkill}
                onAdd={addSkill}
                onRemove={removeSkill}
                items={skills}
                placeholder="Add a skill (e.g., Python, React)"
                suggestions={suggestions.skills}
              />
              {errors.skills && (
                <p className="text-sm text-red-500">{errors.skills.message}</p>
              )}
            </div>
          </div>

          {/* Preferred Sectors */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm">🏢</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Preferred Sectors</h3>
            </div>
            <div className="space-y-4">
              <AutocompleteInput
                value={currentSector}
                onChange={setCurrentSector}
                onAdd={addSector}
                onRemove={removeSector}
                items={preferredSectors}
                placeholder="Add a sector (e.g., Technology, Finance)"
                suggestions={suggestions.sectors}
              />
              {errors.preferredSectors && (
                <p className="text-sm text-red-500">{errors.preferredSectors.message}</p>
              )}
            </div>
          </div>

          {/* Preferred Locations */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm">📍</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Preferred Locations</h3>
            </div>
            <div className="space-y-4">
              <AutocompleteInput
                value={currentLocation}
                onChange={setCurrentLocation}
                onAdd={addLocation}
                onRemove={removeLocation}
                items={preferredLocations}
                placeholder="Add a location (e.g., Bangalore, Mumbai)"
                suggestions={suggestions.locations}
              />
              {errors.preferredLocations && (
                <p className="text-sm text-red-500">{errors.preferredLocations.message}</p>
              )}
            </div>
          </div>

          {/* Remote Work */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm">🏠</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Work Preferences</h3>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <Controller
                name="remoteOk"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="remoteOk"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                )}
              />
              <Label htmlFor="remoteOk" className="text-slate-700 font-medium">Open to remote work opportunities</Label>
            </div>
          </div>


          {/* Availability and Preferences */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm">📅</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Availability & Preferences</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="availabilityStart" className="text-slate-700 font-medium">Available From (Optional)</Label>
                <Input
                  id="availabilityStart"
                  type="date"
                  {...register('availabilityStart')}
                  className="bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="durationWeeksPref" className="text-slate-700 font-medium">Preferred Duration (weeks)</Label>
                <Input
                  id="durationWeeksPref"
                  type="number"
                  {...register('durationWeeksPref')}
                  placeholder="e.g., 12"
                  className="bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="stipendPref" className="text-slate-700 font-medium">Preferred Stipend Range</Label>
                <Input
                  id="stipendPref"
                  {...register('stipendPref')}
                  placeholder="e.g., 10000-20000"
                  className="bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <Button
              type="submit"
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold border-0 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                  <span>Saving Profile...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span>Save Profile & Get Recommendations</span>
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
