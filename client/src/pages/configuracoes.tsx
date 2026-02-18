import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Stethoscope, DoorOpen, Shield } from "lucide-react";
import { Link } from "wouter";

export default function ConfiguracoesPage() {
  const items = [
    { title: "Colaboradores", description: "Gerenciar equipe e permissoes", icon: Users, href: "/colaboradores", color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
    { title: "Servicos", description: "Procedimentos e valores", icon: Stethoscope, href: "/servicos", color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-900/20" },
    { title: "Salas", description: "Gerenciar salas da clinica", icon: DoorOpen, href: "#", color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-900/20" },
    { title: "Seguranca", description: "LGPD e auditoria", icon: Shield, href: "#", color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-900/20" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-config-title">Configuracoes</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie as configuracoes do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <Link key={item.title} href={item.href}>
            <Card className="hover-elevate cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-md ${item.bgColor}`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription className="mt-1">{item.description}</CardDescription>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
