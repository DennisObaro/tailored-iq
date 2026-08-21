import { StarFilled, MapPin, Building2, Clock } from "@/components/icons";
import type { ExpertProfile, User } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatCallWhen } from "@/lib/utils/format";
import { CONTRIBUTION_PREFERENCES, helpAreaLabel, levelLabel } from "@/lib/constants/expert";

/**
 * Exactly what a client sees, rendered from the same profile record —
 * used for the onboarding preview, the expert's own profile page and the
 * reviewer queue, so "how clients will see you" is never a mock-up that
 * drifts from the real thing.
 */
export function ExpertProfilePreview({
  user,
  profile,
  showRate = true,
}: {
  user: User;
  profile: ExpertProfile;
  showRate?: boolean;
}) {
  const prefs = CONTRIBUTION_PREFERENCES.filter((p) => profile.contributionPreferences.includes(p.key));

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar firstName={user.firstName} lastName={user.lastName} src={user.avatarUrl} size="xl" shape="square" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-50">
                {user.firstName} {user.lastName}
              </h2>
              <Badge variant="primary">{levelLabel(profile.expertLevel)}</Badge>
            </div>
            <p className="text-sm text-gray-300">{profile.headline || "—"}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              {profile.currentRole && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-3.5" aria-hidden />
                  {profile.currentRole}
                  {profile.organisation ? ` · ${profile.organisation}` : ""}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden />
                {profile.yearsExperience} years&apos; experience
              </span>
              {profile.markets.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" aria-hidden />
                  {profile.markets.slice(0, 3).join(", ")}
                </span>
              )}
              {profile.reviewCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <StarFilled className="size-3.5 text-gold" aria-hidden />
                  {profile.rating.toFixed(1)} ({profile.reviewCount})
                </span>
              )}
            </div>
          </div>
        </div>
        {profile.bio && <p className="mt-4 text-sm leading-relaxed text-gray-300">{profile.bio}</p>}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What they can help with</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.helpAreas.length === 0 ? (
              <p className="text-sm text-gray-500">Nothing selected yet.</p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-sm text-gray-300">
                {profile.helpAreas.map((areaId) => (
                  <li key={areaId} className="flex gap-2">
                    <span className="text-gold" aria-hidden>
                      &middot;
                    </span>
                    {helpAreaLabel(areaId)}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expertise &amp; industries</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {profile.expertise.map((e) => (
                <Badge key={e.label} variant="primary">
                  {e.label}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.industries.map((i) => (
                <Badge key={i} variant="outline">
                  {i}
                </Badge>
              ))}
            </div>
            {profile.functions.length > 0 && (
              <p className="text-xs text-gray-500">Functions: {profile.functions.join(", ")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>How they contribute</CardTitle>
          </CardHeader>
          <CardContent>
            {prefs.length === 0 ? (
              <p className="text-sm text-gray-500">Nothing selected yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {prefs.map((p) => (
                  <Badge key={p.key}>{p.label}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-gray-300">
            {showRate && (
              <p>
                <span className="text-gray-500">Consultation rate: </span>
                {profile.consultationRate > 0 ? formatCurrency(profile.consultationRate) : "Not set"}
              </p>
            )}
            {profile.availabilityPreferences && (
              <p className="text-xs text-gray-500">
                {profile.availabilityPreferences.hoursPerMonth} hours/month ·{" "}
                {profile.availabilityPreferences.callLengthMinutes}-minute calls ·{" "}
                {profile.availabilityPreferences.noticeDays} days&apos; notice
              </p>
            )}
            {profile.availabilitySlots.length === 0 ? (
              <p className="text-xs text-gray-500">No slots offered yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {profile.availabilitySlots.slice(0, 4).map((slot) => (
                  <Badge key={slot} variant="outline">
                    {formatCallWhen(slot)}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
