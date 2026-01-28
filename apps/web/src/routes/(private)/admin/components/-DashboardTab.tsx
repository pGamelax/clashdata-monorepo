import { Shield, Users, Link2, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardTabProps {
  totalClans: number;
  totalUsers: number;
  totalAdmins: number;
  totalClanAssignments: number;
  clansWithUsers: number;
  clansWithoutUsers: number;
}

export function DashboardTab({
  totalClans,
  totalUsers,
  totalAdmins,
  totalClanAssignments,
  clansWithUsers,
  clansWithoutUsers,
}: DashboardTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clãs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClans}</div>
            <p className="text-xs text-muted-foreground">
              {clansWithUsers} com usuários, {clansWithoutUsers} sem usuários
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {totalAdmins} administradores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atribuições</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClanAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Clãs atribuídos a usuários
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Uso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalClans > 0 ? Math.round((clansWithUsers / totalClans) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Clãs em uso
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Resumo das últimas operações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{totalClans} clãs cadastrados</p>
                  <p className="text-xs text-muted-foreground">{clansWithUsers} em uso</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{totalUsers} usuários ativos</p>
                  <p className="text-xs text-muted-foreground">{totalAdmins} administradores</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Link2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{totalClanAssignments} atribuições</p>
                  <p className="text-xs text-muted-foreground">Clãs vinculados a usuários</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
