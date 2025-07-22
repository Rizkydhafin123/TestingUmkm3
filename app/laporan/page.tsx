"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Download, Loader2, PieChart, BarChart3 } from "lucide-react"
import { umkmService, type UMKM } from "@/lib/db"
import { ProtectedRoute } from "@/components/protected-route"
import { HeaderWithAuth } from "@/components/header-with-auth"
import { NavigationWithAuth } from "@/components/navigation-with-auth"
import { useAuth } from "@/lib/auth"

function LaporanContent() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalUMKM: 0,
    umkmAktif: 0,
    umkmTidakAktif: 0,
    jenisUsahaStats: {} as Record<string, number>,
    statusStats: {} as Record<string, number>,
    umkmList: [] as UMKM[],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [user])

  const loadStats = async () => {
    try {
      setLoading(true)
      console.log("Laporan: Loading stats for user:", user)

      let umkm: UMKM[] = []

      if (user?.role === "admin") {
        console.log("Laporan: Fetching all UMKM for admin RW:", user.rw)
        umkm = await umkmService.getAll(undefined, user.rw)
      } else if (user?.id) {
        console.log("Laporan: Fetching UMKM for regular user ID:", user.id)
        umkm = await umkmService.getAll(user.id)
      } else {
        console.log("Laporan: No user or role detected, returning empty UMKM list.")
        umkm = []
      }

      const umkmAktif = umkm.filter((u) => u.status === "Aktif").length
      const umkmTidakAktif = umkm.filter((u) => u.status !== "Aktif").length

      const jenisUsahaStats = umkm.reduce((acc: Record<string, number>, u) => {
        if (u.jenis_usaha) {
          acc[u.jenis_usaha] = (acc[u.jenis_usaha] || 0) + 1
        }
        return acc
      }, {})

      const statusStats = umkm.reduce((acc: Record<string, number>, u) => {
        if (u.status) {
          acc[u.status] = (acc[u.status] || 0) + 1
        }
        return acc
      }, {})

      setStats({
        totalUMKM: umkm.length,
        umkmAktif,
        umkmTidakAktif,
        jenisUsahaStats,
        statusStats,
        umkmList: umkm,
      })
      console.log("Laporan: Stats loaded successfully. Total UMKM:", umkm.length)
    } catch (error) {
      console.error("Laporan: Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    let reportContent = `Laporan Data UMKM ${user?.role === "admin" ? `RW ${user.rw}` : ""}\n`
    reportContent += `Tanggal Export: ${new Date().toLocaleDateString()}\n\n`

    reportContent += "RINGKASAN STATISTIK:\n"
    reportContent += `Total UMKM Terdaftar: ${stats.totalUMKM}\n`
    reportContent += `UMKM Aktif: ${stats.umkmAktif}\n`
    reportContent += `UMKM Tidak Aktif: ${stats.umkmTidakAktif}\n\n`

    reportContent += "DISTRIBUSI JENIS USAHA:\n"
    if (Object.keys(stats.jenisUsahaStats).length > 0) {
      Object.entries(stats.jenisUsahaStats).forEach(([jenis, jumlah]) => {
        reportContent += `- ${jenis}: ${jumlah} UMKM\n`
      })
    } else {
      reportContent += "Tidak ada data jenis usaha.\n"
    }
    reportContent += "\n"

    reportContent += "DISTRIBUSI STATUS OPERASIONAL:\n"
    if (Object.keys(stats.statusStats).length > 0) {
      Object.entries(stats.statusStats).forEach(([status, jumlah]) => {
        reportContent += `- ${status}: ${jumlah} UMKM\n`
      })
    } else {
      reportContent += "Tidak ada data status operasional.\n"
    }
    reportContent += "\n"

    reportContent += "DAFTAR LENGKAP UMKM:\n"
    if (stats.umkmList.length > 0) {
      const headers = ["Nama Usaha", "Pemilik", "Jenis Usaha", "Status", "Tanggal Daftar"]
      reportContent += headers.join("\t") + "\n"
      stats.umkmList.forEach((umkm) => {
        const row = [
          umkm.nama_usaha,
          umkm.pemilik,
          umkm.jenis_usaha,
          umkm.status,
          umkm.tanggal_daftar ? new Date(umkm.tanggal_daftar).toLocaleDateString() : "-",
        ]
        reportContent += row.join("\t") + "\n"
      })
    } else {
      reportContent += "Tidak ada UMKM terdaftar.\n"
    }

    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `laporan-umkm-${user?.role === "admin" ? `rw-${user.rw}` : "user"}-${new Date().toISOString().split("T")[0]}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat laporan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <HeaderWithAuth
        title={`Laporan UMKM ${user?.role === "admin" ? `RW ${user.rw}` : ""}`}
        description={`Analisis dan statistik UMKM mikro ${user?.role === "admin" ? `di RW ${user.rw}` : "di wilayah Anda"}`}
      >
        <Button
          variant="outline"
          onClick={exportReport}
          className="border-border bg-transparent rounded-lg hover:bg-muted"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Laporan
        </Button>
      </HeaderWithAuth>

      <NavigationWithAuth />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card shadow-lg hover:shadow-xl transition-shadow border border-border rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total UMKM {user?.role === "admin" ? `RW ${user.rw}` : ""}
              </CardTitle>
              <Building2 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalUMKM}</div>
              <p className="text-sm text-muted-foreground mt-1">Usaha terdaftar</p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-lg hover:shadow-xl transition-shadow border border-border rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">UMKM Aktif</CardTitle>
              <BarChart3 className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.umkmAktif}</div>
              <p className="text-sm text-muted-foreground mt-1">Beroperasi aktif</p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-lg hover:shadow-xl transition-shadow border border-border rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">UMKM Tidak Aktif</CardTitle>
              <BarChart3 className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.umkmTidakAktif}</div>
              <p className="text-sm text-muted-foreground mt-1">Tidak beroperasi</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-card shadow-lg border border-border rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <PieChart className="h-5 w-5 mr-2 text-primary" />
                Distribusi Jenis Usaha
              </CardTitle>
              <CardDescription className="text-muted-foreground">Sebaran UMKM berdasarkan jenis usaha</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.jenisUsahaStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([jenis, jumlah]) => (
                    <div key={jenis} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{jenis}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                            style={{ width: `${stats.totalUMKM > 0 ? (jumlah / stats.totalUMKM) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-foreground w-8">{jumlah}</span>
                      </div>
                    </div>
                  ))}
                {Object.keys(stats.jenisUsahaStats).length === 0 && (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Belum ada data jenis usaha</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-lg border border-border rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <PieChart className="h-5 w-5 mr-2 text-green-600" />
                Distribusi Status Operasional
              </CardTitle>
              <CardDescription className="text-muted-foreground">Sebaran UMKM berdasarkan status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.statusStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, jumlah]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{status}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              status === "Aktif"
                                ? "bg-green-500"
                                : status === "Tidak Aktif"
                                  ? "bg-red-500"
                                  : "bg-gray-500"
                            }`}
                            style={{ width: `${stats.totalUMKM > 0 ? (jumlah / stats.totalUMKM) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-foreground w-8">{jumlah}</span>
                      </div>
                    </div>
                  ))}
                {Object.keys(stats.statusStats).length === 0 && (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Belum ada data status</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card shadow-lg border border-border rounded-xl mt-8">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Building2 className="h-5 w-5 mr-2 text-purple-600" />
              Daftar Lengkap UMKM
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Detail semua UMKM yang terdaftar di wilayah Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Nama Usaha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Pemilik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Jenis Usaha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tanggal Daftar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {stats.umkmList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        Tidak ada data UMKM untuk ditampilkan.
                      </td>
                    </tr>
                  ) : (
                    stats.umkmList.map((umkm) => (
                      <tr key={umkm.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {umkm.nama_usaha}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{umkm.pemilik}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {umkm.jenis_usaha}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge
                            variant={
                              umkm.status === "Aktif"
                                ? "default"
                                : umkm.status === "Tidak Aktif"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className={
                              umkm.status === "Aktif"
                                ? "bg-green-100 text-green-800 border-green-200 rounded-md"
                                : umkm.status === "Tidak Aktif"
                                  ? "bg-destructive/10 text-destructive border-destructive/20 rounded-md"
                                  : "bg-muted text-muted-foreground border-border rounded-md"
                            }
                          >
                            {umkm.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {umkm.tanggal_daftar ? new Date(umkm.tanggal_daftar).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function Laporan() {
  return (
    <ProtectedRoute>
      <LaporanContent />
    </ProtectedRoute>
  )
}
