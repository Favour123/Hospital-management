'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Camera, CheckCircle, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'

export default function PhotoUploadPage() {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { toast.error('File too large. Max 5MB.'); return }
    if (!f.type.startsWith('image/')) { toast.error('Please select an image file.'); return }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setProgress(20)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setUploading(false); return }

    setProgress(40)
    const ext = file.name.split('.').pop()
    const path = `profile-photos/${user.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('smartmed-assets')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      toast.error(uploadError.message)
      setUploading(false)
      setProgress(0)
      return
    }

    setProgress(70)
    const { data: { publicUrl } } = supabase.storage
      .from('smartmed-assets')
      .getPublicUrl(path)

    // Update student_profiles
    const { error: profileError } = await supabase
      .from('student_profiles')
      .update({ photo_url: publicUrl, photo_done: true })
      .eq('id', user.id)

    // Also update main profile photo_url
    await supabase
      .from('profiles')
      .update({ photo_url: publicUrl })
      .eq('id', user.id)

    setProgress(100)
    if (profileError) {
      toast.error(profileError.message)
      setUploading(false)
      return
    }

    toast.success('Profile photo uploaded! Welcome to SMARTMED.')
    router.push('/dashboard/student')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { step: '1', label: 'Register', done: true },
            { step: '2', label: 'Verify Email', done: true },
            { step: '3', label: 'Upload Photo', active: true },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center flex-1">
              <div className={`flex h-7 w-7 shrink-0 rounded-full items-center justify-center text-xs font-bold ${
                s.done ? 'bg-green-500 text-white' : s.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {s.done ? <CheckCircle className="h-4 w-4" /> : s.step}
              </div>
              <span className={`ml-1.5 text-xs font-medium hidden sm:block ${
                s.active ? 'text-primary' : s.done ? 'text-green-600' : 'text-muted-foreground'
              }`}>{s.label}</span>
              {i < 2 && <div className="flex-1 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Upload Your Photo</h1>
          <p className="text-muted-foreground mt-1">
            A clear photo is required to complete your registration and access the medical portal.
          </p>
        </div>

        {/* Upload area */}
        <div
          onClick={() => inputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-8 flex flex-col items-center gap-4 cursor-pointer transition-colors ${
            preview ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }`}
        >
          {preview ? (
            <>
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="h-40 w-40 rounded-full object-cover border-4 border-primary/20"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null) }}
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-white flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm font-medium text-primary">{file?.name}</p>
              <p className="text-xs text-muted-foreground">Click to change photo</p>
            </>
          ) : (
            <>
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <Camera className="h-9 w-9 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Click to select photo</p>
                <p className="text-sm text-muted-foreground mt-1">JPG, PNG or WEBP · Max 5MB</p>
              </div>
              <div className="flex items-center gap-2 text-primary">
                <Upload className="h-4 w-4" />
                <span className="text-sm font-medium">Browse files</span>
              </div>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {uploading && (
          <div className="mt-4 space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-center text-muted-foreground">Uploading… {progress}%</p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading…' : 'Upload & Continue'}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Your photo will be used for identification at the medical center.
          </p>
        </div>
      </div>
    </div>
  )
}
